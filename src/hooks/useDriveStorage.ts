import { useState, useCallback } from 'react';
import { CardData } from '../types';
import * as driveStorage from '../services/driveStorage';

export function useDriveStorage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  const initializeStorage = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await driveStorage.initializeDriveStorage();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const saveCard = useCallback(async (
    card: CardData, 
    passphrase: string,
    imageBlob?: Blob,
    thumbnails?: { [size: string]: Blob }
  ) => {
    setLoading(true);
    setError(null);
    setProgress(0);
    
    try {
      // Save card data
      const fileId = await driveStorage.saveCardToDrive(
        card,
        passphrase,
        (progress) => setProgress(progress * 0.5) // 50% for card data
      );
      
      // Save image if provided
      if (imageBlob) {
        await driveStorage.saveCardImageToDrive(
          card.id,
          imageBlob,
          passphrase,
          (progress) => setProgress(50 + progress * 0.25) // 25% for image
        );
      }
      
      // Save thumbnails if provided
      if (thumbnails && Object.keys(thumbnails).length > 0) {
        await driveStorage.saveCardThumbnailsToDrive(
          card.id,
          thumbnails,
          passphrase,
          (progress) => setProgress(75 + progress * 0.25) // 25% for thumbnails
        );
      }
      
      setProgress(100);
      return fileId;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
      setProgress(0);
    }
  }, []);

  const loadCard = useCallback(async (fileId: string, passphrase: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const card = await driveStorage.loadCardFromDrive(fileId, passphrase);
      return card;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCardImage = useCallback(async (fileId: string, passphrase: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const imageBlob = await driveStorage.loadCardImageFromDrive(fileId, passphrase);
      return imageBlob;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const listCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const cards = await driveStorage.listCardsFromDrive();
      return cards;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCard = useCallback(async (
    fileId: string,
    card: CardData,
    passphrase: string
  ) => {
    setLoading(true);
    setError(null);
    setProgress(0);
    
    try {
      await driveStorage.updateCardInDrive(
        fileId,
        card,
        passphrase,
        (progress) => setProgress(progress)
      );
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
      setProgress(0);
    }
  }, []);

  const deleteCard = useCallback(async (cardId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await driveStorage.deleteCardFromDrive(cardId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const savePreferences = useCallback(async (preferences: any, passphrase: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await driveStorage.savePreferencesToDrive(preferences, passphrase);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPreferences = useCallback(async (passphrase: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const preferences = await driveStorage.loadPreferencesFromDrive(passphrase);
      return preferences;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const saveCardIndex = useCallback(async (index: any[], passphrase: string) => {
    try {
      await driveStorage.saveCardIndexToDrive(index, passphrase);
    } catch (err: any) {
      console.error('Error saving card index:', err);
      // Don't throw - index is optional optimization
    }
  }, []);

  const loadCardIndex = useCallback(async (passphrase: string) => {
    try {
      const index = await driveStorage.loadCardIndexFromDrive(passphrase);
      return index;
    } catch (err: any) {
      console.error('Error loading card index:', err);
      return null; // Index is optional
    }
  }, []);

  const getStorageUsage = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const usage = await driveStorage.getAppStorageUsage();
      return usage;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    initializeStorage,
    saveCard,
    loadCard,
    loadCardImage,
    listCards,
    updateCard,
    deleteCard,
    savePreferences,
    loadPreferences,
    saveCardIndex,
    loadCardIndex,
    getStorageUsage,
    loading,
    error,
    progress
  };
}