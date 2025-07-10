import { getAccessToken } from './auth';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3';
const FOLDER_NAME = 'SecureCardr';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  parents?: string[];
}

export interface DriveFileMetadata {
  name: string;
  mimeType: string;
  parents?: string[];
  description?: string;
}

/**
 * Get authorization headers for Drive API requests
 */
function getAuthHeaders(): HeadersInit {
  const token = getAccessToken();
  if (!token) {
    throw new Error('No access token available. Please sign in again.');
  }
  
  return {
    'Authorization': `Bearer ${token}`,
  };
}

/**
 * Handle Drive API errors
 */
async function handleDriveError(response: Response): Promise<never> {
  let errorMessage = 'Drive API error';
  
  try {
    const errorData = await response.json();
    errorMessage = errorData.error?.message || errorMessage;
  } catch {
    errorMessage = `Drive API error: ${response.status} ${response.statusText}`;
  }
  
  // Check for common errors
  if (response.status === 401) {
    sessionStorage.removeItem('googleAccessToken');
    throw new Error('Authentication expired. Please sign in again.');
  } else if (response.status === 403) {
    throw new Error('Permission denied. Please grant Drive access.');
  } else if (response.status === 404) {
    throw new Error('File or folder not found.');
  } else if (response.status === 507) {
    throw new Error('Drive storage quota exceeded.');
  }
  
  throw new Error(errorMessage);
}

/**
 * Get or create the SecureCardr folder
 */
export async function getOrCreateAppFolder(): Promise<string> {
  // Check if we have a cached folder ID
  const cachedFolderId = sessionStorage.getItem('driveFolderId');
  if (cachedFolderId) {
    // Verify it still exists
    try {
      await getFile(cachedFolderId);
      return cachedFolderId;
    } catch {
      // Folder doesn't exist anymore, create a new one
      sessionStorage.removeItem('driveFolderId');
    }
  }
  
  // Search for existing folder
  const query = `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const searchResponse = await fetch(
    `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
    {
      headers: getAuthHeaders()
    }
  );
  
  if (!searchResponse.ok) {
    await handleDriveError(searchResponse);
  }
  
  const searchData = await searchResponse.json();
  
  if (searchData.files && searchData.files.length > 0) {
    // Folder exists
    const folderId = searchData.files[0].id;
    sessionStorage.setItem('driveFolderId', folderId);
    return folderId;
  }
  
  // Create new folder
  const metadata: DriveFileMetadata = {
    name: FOLDER_NAME,
    mimeType: 'application/vnd.google-apps.folder'
  };
  
  const createResponse = await fetch(
    `${DRIVE_API_BASE}/files`,
    {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metadata)
    }
  );
  
  if (!createResponse.ok) {
    await handleDriveError(createResponse);
  }
  
  const folderData = await createResponse.json();
  sessionStorage.setItem('driveFolderId', folderData.id);
  return folderData.id;
}

/**
 * Create a subfolder within the app folder
 */
export async function createSubfolder(name: string, parentId: string): Promise<string> {
  const metadata: DriveFileMetadata = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentId]
  };
  
  const response = await fetch(
    `${DRIVE_API_BASE}/files`,
    {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metadata)
    }
  );
  
  if (!response.ok) {
    await handleDriveError(response);
  }
  
  const data = await response.json();
  return data.id;
}

/**
 * Upload a file to Drive
 */
export async function uploadFile(
  content: Blob | string,
  metadata: DriveFileMetadata,
  onProgress?: (progress: number) => void
): Promise<DriveFile> {
  // Ensure parent folder exists
  if (!metadata.parents || metadata.parents.length === 0) {
    const folderId = await getOrCreateAppFolder();
    metadata.parents = [folderId];
  }
  
  // Convert string content to Blob if needed
  const blob = typeof content === 'string' 
    ? new Blob([content], { type: metadata.mimeType })
    : content;
  
  // Use multipart upload for metadata + content
  const boundary = '-------314159265358979323846';
  const delimiter = "\r\n--" + boundary + "\r\n";
  const closeDelimiter = "\r\n--" + boundary + "--";
  
  const metadataString = JSON.stringify(metadata);
  
  // Build multipart request body
  const multipartBody = new Blob([
    delimiter,
    'Content-Type: application/json; charset=UTF-8\r\n\r\n',
    metadataString,
    delimiter,
    `Content-Type: ${metadata.mimeType}\r\n\r\n`,
    blob,
    closeDelimiter
  ]);
  
  const xhr = new XMLHttpRequest();
  
  return new Promise((resolve, reject) => {
    // Track upload progress
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      };
    }
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new Error('Failed to parse upload response'));
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
      }
    };
    
    xhr.onerror = () => reject(new Error('Network error during upload'));
    
    xhr.open('POST', `${UPLOAD_API_BASE}/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size`);
    xhr.setRequestHeader('Authorization', `Bearer ${getAccessToken()}`);
    xhr.setRequestHeader('Content-Type', `multipart/related; boundary="${boundary}"`);
    xhr.send(multipartBody);
  });
}

/**
 * Update an existing file
 */
export async function updateFile(
  fileId: string,
  content: Blob | string,
  metadata?: Partial<DriveFileMetadata>,
  onProgress?: (progress: number) => void
): Promise<DriveFile> {
  const blob = typeof content === 'string' 
    ? new Blob([content], { type: metadata?.mimeType || 'application/json' })
    : content;
  
  // If metadata is provided, use multipart update
  if (metadata && Object.keys(metadata).length > 0) {
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const closeDelimiter = "\r\n--" + boundary + "--";
    
    const metadataString = JSON.stringify(metadata);
    
    const multipartBody = new Blob([
      delimiter,
      'Content-Type: application/json; charset=UTF-8\r\n\r\n',
      metadataString,
      delimiter,
      `Content-Type: ${metadata.mimeType || 'application/octet-stream'}\r\n\r\n`,
      blob,
      closeDelimiter
    ]);
    
    const xhr = new XMLHttpRequest();
    
    return new Promise((resolve, reject) => {
      if (onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        };
      }
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Failed to parse update response'));
          }
        } else {
          reject(new Error(`Update failed: ${xhr.status} ${xhr.statusText}`));
        }
      };
      
      xhr.onerror = () => reject(new Error('Network error during update'));
      
      xhr.open('PATCH', `${UPLOAD_API_BASE}/files/${fileId}?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size`);
      xhr.setRequestHeader('Authorization', `Bearer ${getAccessToken()}`);
      xhr.setRequestHeader('Content-Type', `multipart/related; boundary="${boundary}"`);
      xhr.send(multipartBody);
    });
  } else {
    // Simple media upload without metadata
    const response = await fetch(
      `${UPLOAD_API_BASE}/files/${fileId}?uploadType=media&fields=id,name,mimeType,modifiedTime,size`,
      {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': blob.type
        },
        body: blob
      }
    );
    
    if (!response.ok) {
      await handleDriveError(response);
    }
    
    return await response.json();
  }
}

/**
 * Download a file from Drive
 */
export async function downloadFile(fileId: string): Promise<Blob> {
  const response = await fetch(
    `${DRIVE_API_BASE}/files/${fileId}?alt=media`,
    {
      headers: getAuthHeaders()
    }
  );
  
  if (!response.ok) {
    await handleDriveError(response);
  }
  
  return await response.blob();
}

/**
 * Get file metadata
 */
export async function getFile(fileId: string): Promise<DriveFile> {
  const response = await fetch(
    `${DRIVE_API_BASE}/files/${fileId}?fields=id,name,mimeType,modifiedTime,size,parents`,
    {
      headers: getAuthHeaders()
    }
  );
  
  if (!response.ok) {
    await handleDriveError(response);
  }
  
  return await response.json();
}

/**
 * List files in a folder
 */
export async function listFiles(
  folderId?: string,
  query?: string,
  pageSize: number = 100,
  pageToken?: string
): Promise<{ files: DriveFile[]; nextPageToken?: string }> {
  let q = query || '';
  
  if (folderId) {
    q = q ? `${q} and '${folderId}' in parents` : `'${folderId}' in parents`;
  }
  
  // Always exclude trashed files
  q = q ? `${q} and trashed=false` : 'trashed=false';
  
  const params = new URLSearchParams({
    q,
    pageSize: pageSize.toString(),
    fields: 'nextPageToken,files(id,name,mimeType,modifiedTime,size,parents)',
    orderBy: 'modifiedTime desc'
  });
  
  if (pageToken) {
    params.append('pageToken', pageToken);
  }
  
  const response = await fetch(
    `${DRIVE_API_BASE}/files?${params.toString()}`,
    {
      headers: getAuthHeaders()
    }
  );
  
  if (!response.ok) {
    await handleDriveError(response);
  }
  
  return await response.json();
}

/**
 * Delete a file (move to trash)
 */
export async function deleteFile(fileId: string): Promise<void> {
  const response = await fetch(
    `${DRIVE_API_BASE}/files/${fileId}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders()
    }
  );
  
  if (!response.ok) {
    await handleDriveError(response);
  }
}

/**
 * Batch delete multiple files
 */
export async function batchDeleteFiles(fileIds: string[]): Promise<void> {
  // Google Drive API doesn't support batch delete directly,
  // so we'll use Promise.all for concurrent deletions
  const deletePromises = fileIds.map(fileId => deleteFile(fileId));
  
  try {
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error during batch delete:', error);
    throw new Error('Failed to delete some files. Please try again.');
  }
}

/**
 * Search for files
 */
export async function searchFiles(
  searchTerm: string,
  folderId?: string,
  mimeType?: string
): Promise<DriveFile[]> {
  const queries: string[] = [];
  
  // Search in name and content
  if (searchTerm) {
    queries.push(`(name contains '${searchTerm}' or fullText contains '${searchTerm}')`);
  }
  
  // Filter by folder
  if (folderId) {
    queries.push(`'${folderId}' in parents`);
  }
  
  // Filter by mime type
  if (mimeType) {
    queries.push(`mimeType='${mimeType}'`);
  }
  
  // Exclude trashed files
  queries.push('trashed=false');
  
  const query = queries.join(' and ');
  
  const result = await listFiles(undefined, query);
  return result.files;
}

/**
 * Get storage quota information
 */
export async function getStorageQuota(): Promise<{
  usage: number;
  limit: number;
  usageInDrive: number;
  usageInDriveTrash: number;
}> {
  const response = await fetch(
    `${DRIVE_API_BASE}/about?fields=storageQuota`,
    {
      headers: getAuthHeaders()
    }
  );
  
  if (!response.ok) {
    await handleDriveError(response);
  }
  
  const data = await response.json();
  return {
    usage: parseInt(data.storageQuota.usage || '0'),
    limit: parseInt(data.storageQuota.limit || '0'),
    usageInDrive: parseInt(data.storageQuota.usageInDrive || '0'),
    usageInDriveTrash: parseInt(data.storageQuota.usageInDriveTrash || '0')
  };
}

/**
 * Create app folder structure
 */
export async function initializeDriveStructure(): Promise<{
  rootFolderId: string;
  cardsFolderId: string;
  metadataFolderId: string;
  configFolderId: string;
}> {
  // Get or create root folder
  const rootFolderId = await getOrCreateAppFolder();
  
  // Check for existing subfolders
  const existingFiles = await listFiles(rootFolderId);
  
  let cardsFolderId = '';
  let metadataFolderId = '';
  let configFolderId = '';
  
  // Find existing folders
  for (const file of existingFiles.files) {
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      switch (file.name) {
        case 'cards':
          cardsFolderId = file.id;
          break;
        case 'metadata':
          metadataFolderId = file.id;
          break;
        case 'config':
          configFolderId = file.id;
          break;
      }
    }
  }
  
  // Create missing folders
  if (!cardsFolderId) {
    cardsFolderId = await createSubfolder('cards', rootFolderId);
  }
  if (!metadataFolderId) {
    metadataFolderId = await createSubfolder('metadata', rootFolderId);
  }
  if (!configFolderId) {
    configFolderId = await createSubfolder('config', rootFolderId);
  }
  
  return {
    rootFolderId,
    cardsFolderId,
    metadataFolderId,
    configFolderId
  };
}