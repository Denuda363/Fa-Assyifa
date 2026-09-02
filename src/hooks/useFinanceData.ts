import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Transaction, CompanyProfile, DEFAULT_PROFILE } from '../types';

export function useFinanceData() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profile, setProfile] = useState<CompanyProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to transactions
    const q = query(collection(db, 'transactions'), orderBy('timestamp', 'desc'));
    const unsubscribeTx = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      setTransactions(txs);
      setLoading(false);
    });

    // Listen to profile
    const profileRef = doc(db, 'settings', 'profile');
    const unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data() as CompanyProfile);
      } else {
        // Set default profile if it doesn't exist
        setDoc(profileRef, DEFAULT_PROFILE);
      }
    });

    return () => {
      unsubscribeTx();
      unsubscribeProfile();
    };
  }, []);

  const addTransaction = async (tx: Omit<Transaction, 'id' | 'timestamp'>) => {
    await addDoc(collection(db, 'transactions'), {
      ...tx,
      timestamp: Date.now()
    });
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    await updateDoc(doc(db, 'transactions', id), data);
  };

  const deleteTransaction = async (id: string) => {
    await deleteDoc(doc(db, 'transactions', id));
  };

  const updateProfile = async (data: Partial<CompanyProfile>) => {
    await setDoc(doc(db, 'settings', 'profile'), { ...profile, ...data }, { merge: true });
  };

  return {
    transactions,
    profile,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    updateProfile
  };
}
