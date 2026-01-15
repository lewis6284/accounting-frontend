import api from './api';

export const getCandidatePayments = async () => {
    const response = await api.get('/payments/candidate');
    return response.data;
};

export const getSalaryPayments = async () => {
    const response = await api.get('/payments/salary');
    return response.data;
};
