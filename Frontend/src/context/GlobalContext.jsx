import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAccounts } from '../services/accountService';
import { getExpenseCategories, getCandidatePaymentTypes, getRevenueTypes, getSuppliers } from '../services/basicDataService';
import { getEmployees } from '../services/employeeService';
import toast from 'react-hot-toast';

const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
    const [accounts, setAccounts] = useState([]);
    const [expenseCategories, setExpenseCategories] = useState([]);
    const [candidatePaymentTypes, setCandidatePaymentTypes] = useState([]);
    const [revenueTypes, setRevenueTypes] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    const refreshGlobalData = async () => {
        try {
            setLoading(true);
            const [accRes, expRes, candRes, revRes, supRes, empRes] = await Promise.all([
                getAccounts(),
                getExpenseCategories(),
                getCandidatePaymentTypes(),
                getRevenueTypes(),
                getSuppliers(),
                getEmployees()
            ]);

            setAccounts(accRes);
            setExpenseCategories(expRes);
            setCandidatePaymentTypes(candRes);
            setRevenueTypes(revRes);
            setSuppliers(supRes);
            setEmployees(empRes);
        } catch (error) {
            console.error("Failed to load global data", error);
            // Don't toast here to avoid spam on login, handle in components if needed
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial load
        // refreshGlobalData(); // Can be triggered by AuthContext login success if needed
    }, []);

    return (
        <GlobalContext.Provider value={{
            accounts,
            expenseCategories,
            candidatePaymentTypes,
            revenueTypes,
            suppliers,
            employees,
            loading,
            refreshGlobalData
        }}>
            {children}
        </GlobalContext.Provider>
    );
};

export const useGlobal = () => useContext(GlobalContext);
