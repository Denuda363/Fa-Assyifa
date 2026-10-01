import { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Transaction, CompanyProfile, DEFAULT_PROFILE, Loan, LoanPayment } from '../types';

export function useFinanceData() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [profile, setProfile] = useState<CompanyProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Listen to transactions
    const qTx = query(collection(db, 'transactions'), orderBy('timestamp', 'desc'));
    const unsubscribeTx = onSnapshot(
      qTx, 
      (snapshot) => {
        const txs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Transaction[];
        setTransactions(txs);
        setLoading(false);
      },
      (error) => {
        console.warn('Transactions snapshot notice (offline/reconnecting):', error.message);
        setLoading(false);
      }
    );

    // Listen to loans
    const qLoans = query(collection(db, 'loans'), orderBy('timestamp', 'desc'));
    const unsubscribeLoans = onSnapshot(
      qLoans, 
      (snapshot) => {
        const loanList = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            type: data.type || 'employee',
            borrowerName: data.borrowerName || '',
            amount: Number(data.amount) || 0,
            date: data.date || new Date().toISOString().split('T')[0],
            notes: data.notes || '',
            status: data.status || 'active',
            payments: Array.isArray(data.payments) ? data.payments : [],
            transactionId: data.transactionId || null,
            disbursementMethod: data.disbursementMethod || 'cash',
            timestamp: data.timestamp || Date.now()
          } as Loan;
        });
        setLoans(loanList);
      },
      (error) => {
        console.warn('Loans snapshot notice (offline/reconnecting):', error.message);
      }
    );

    // Listen to profile
    const profileRef = doc(db, 'settings', 'profile');
    const unsubscribeProfile = onSnapshot(
      profileRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data() as CompanyProfile);
        } else {
          setDoc(profileRef, DEFAULT_PROFILE).catch((err) => {
            console.warn('Could not initialize default profile:', err);
          });
        }
      },
      (error) => {
        console.warn('Profile snapshot notice (offline/reconnecting):', error.message);
      }
    );

    return () => {
      unsubscribeTx();
      unsubscribeLoans();
      unsubscribeProfile();
    };
  }, []);

  // --- Transactions ---
  const addTransaction = async (tx: Omit<Transaction, 'id' | 'timestamp'>) => {
    const docRef = await addDoc(collection(db, 'transactions'), {
      ...tx,
      timestamp: Date.now()
    });
    return docRef.id;
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

  // --- Loans (Pinjaman) ---
  const addLoan = async (
    loanInput: {
      type: 'employee' | 'owner';
      borrowerName: string;
      amount: number;
      date: string;
      notes?: string;
      disbursementMethod?: string;
    },
    syncTransaction = true
  ) => {
    let linkedTxId: string | null = null;

    if (syncTransaction) {
      try {
        const method = loanInput.disbursementMethod || 'cash';
        const isTf = method.startsWith('tf');
        const category = loanInput.type === 'owner' 
          ? (isTf ? 'TF Pinjaman Owner' : 'Pinjaman Owner') 
          : (isTf ? 'TF Pinjaman Karyawan' : 'Pinjaman Karyawan');

        const txNotes = `Pinjaman ${loanInput.type === 'owner' ? 'Owner' : `Karyawan (${loanInput.borrowerName})`}${loanInput.notes ? ': ' + loanInput.notes : ''}`;

        const txDoc = await addDoc(collection(db, 'transactions'), {
          type: 'outcome',
          method: isTf ? 'tf' : 'cash',
          category,
          amount: loanInput.amount,
          date: loanInput.date,
          notes: txNotes,
          timestamp: Date.now()
        });
        linkedTxId = txDoc.id;
      } catch (err) {
        console.error('Failed to sync loan outcome transaction:', err);
      }
    }

    const loanDoc = await addDoc(collection(db, 'loans'), {
      type: loanInput.type,
      borrowerName: loanInput.borrowerName,
      amount: loanInput.amount,
      date: loanInput.date,
      notes: loanInput.notes || '',
      status: 'active',
      payments: [],
      transactionId: linkedTxId,
      disbursementMethod: loanInput.disbursementMethod || 'cash',
      timestamp: Date.now()
    });

    return loanDoc.id;
  };

  const updateLoan = async (id: string, data: Partial<Loan>) => {
    await updateDoc(doc(db, 'loans', id), data);
  };

  const deleteLoan = async (id: string, deleteLinkedTx = true) => {
    const loanToDelete = loans.find(l => l.id === id);
    if (loanToDelete && deleteLinkedTx) {
      // Delete disbursement transaction if exists
      if (loanToDelete.transactionId) {
        try {
          await deleteDoc(doc(db, 'transactions', loanToDelete.transactionId));
        } catch (e) {
          console.warn('Could not delete linked transaction:', e);
        }
      }
      // Delete payments transactions if any
      if (loanToDelete.payments && loanToDelete.payments.length > 0) {
        for (const p of loanToDelete.payments) {
          if (p.transactionId) {
            try {
              await deleteDoc(doc(db, 'transactions', p.transactionId));
            } catch (e) {
              console.warn('Could not delete payment transaction:', e);
            }
          }
        }
      }
    }
    await deleteDoc(doc(db, 'loans', id));
  };

  // --- Loan Payments (Pembayaran / Pelunasan Pinjaman) ---
  const addLoanPayment = async (
    loanId: string,
    paymentInput: {
      amount: number;
      date: string;
      method: string;
      notes?: string;
    },
    syncTransaction = true
  ) => {
    const targetLoan = loans.find(l => l.id === loanId);
    if (!targetLoan) throw new Error('Loan not found');

    let paymentTxId: string | null = null;
    if (syncTransaction) {
      try {
        const isTf = paymentInput.method.startsWith('tf');
        const category = targetLoan.type === 'owner' 
          ? 'Pelunasan Pinjaman Owner' 
          : 'Pelunasan Pinjaman Karyawan';

        const txNotes = `Pelunasan Pinjaman ${targetLoan.type === 'owner' ? 'Owner' : targetLoan.borrowerName}${paymentInput.notes ? ': ' + paymentInput.notes : ''}`;

        const txDoc = await addDoc(collection(db, 'transactions'), {
          type: 'income',
          method: paymentInput.method,
          category,
          amount: paymentInput.amount,
          date: paymentInput.date,
          notes: txNotes,
          timestamp: Date.now()
        });
        paymentTxId = txDoc.id;
      } catch (err) {
        console.error('Failed to sync loan payment transaction:', err);
      }
    }

    const newPayment: LoanPayment = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      amount: paymentInput.amount,
      date: paymentInput.date,
      method: paymentInput.method,
      notes: paymentInput.notes || '',
      timestamp: Date.now(),
      transactionId: paymentTxId || undefined
    };

    const updatedPayments = [...(targetLoan.payments || []), newPayment];
    const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
    const newStatus: 'active' | 'paid' = totalPaid >= targetLoan.amount ? 'paid' : 'active';

    await updateDoc(doc(db, 'loans', loanId), {
      payments: updatedPayments,
      status: newStatus
    });
  };

  const deleteLoanPayment = async (loanId: string, paymentId: string, deleteLinkedTx = true) => {
    const targetLoan = loans.find(l => l.id === loanId);
    if (!targetLoan) return;

    const paymentToDelete = (targetLoan.payments || []).find(p => p.id === paymentId);
    if (paymentToDelete && deleteLinkedTx && paymentToDelete.transactionId) {
      try {
        await deleteDoc(doc(db, 'transactions', paymentToDelete.transactionId));
      } catch (e) {
        console.warn('Could not delete payment transaction:', e);
      }
    }

    const updatedPayments = (targetLoan.payments || []).filter(p => p.id !== paymentId);
    const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
    const newStatus: 'active' | 'paid' = totalPaid >= targetLoan.amount ? 'paid' : 'active';

    await updateDoc(doc(db, 'loans', loanId), {
      payments: updatedPayments,
      status: newStatus
    });
  };

  return {
    transactions,
    loans,
    profile,
    loading,
    isOnline,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    updateProfile,
    addLoan,
    updateLoan,
    deleteLoan,
    addLoanPayment,
    deleteLoanPayment
  };
}
