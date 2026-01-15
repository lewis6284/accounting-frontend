import React, { useState, useEffect } from 'react';
import Table, { TableRow, TableCell } from '../components/Table';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import QRCodeGenerator from '../components/QRCodeGenerator';
import { getEmployees, createEmployee, createSalaryPayment, updateEmployee, deleteEmployee, softDeleteEmployee } from '../services/employeeService';
import { useGlobal } from '../context/GlobalContext';
import { Plus, DollarSign, Edit, Trash2, QrCode, Phone, Briefcase, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const Employees = () => {
    const { accounts } = useGlobal();
    const [employees, setEmployees] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    // Form States
    const today = new Date().toISOString().split('T')[0];
    const initialFormState = { name: '', phone: '', job_function: '', monthly_salary: '', hire_date: today, status: 'ACTIVE' };
    const [employeeForm, setEmployeeForm] = useState(initialFormState);
    const [paymentData, setPaymentData] = useState({
        amount: '',
        month: new Date().toISOString().slice(0, 7), // YYYY-MM
        account_id: '',
        payment_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadEmployees();
    }, []);

    const loadEmployees = async () => {
        try {
            const data = await getEmployees();
            setEmployees(data);
        } catch (error) {
            toast.error('Failed to load employees');
        }
    };

    const handleCreateEmployee = async (e) => {
        e.preventDefault();
        try {
            await createEmployee(employeeForm);
            toast.success('Employee created successfully');
            setIsAddModalOpen(false);
            loadEmployees();
            setEmployeeForm(initialFormState);
        } catch (error) {
            toast.error('Failed to create employee');
        }
    };

    const handleUpdateEmployee = async (e) => {
        e.preventDefault();
        try {
            await updateEmployee(selectedEmployee.id, employeeForm);
            toast.success('Employee updated');
            setIsEditModalOpen(false);
            loadEmployees();
        } catch (error) {
            toast.error('Failed to update employee');
        }
    };

    const handleDeleteEmployee = async () => {
        try {
            await softDeleteEmployee(selectedEmployee.id);
            toast.success(`Employee ${selectedEmployee.name} deactivated`);
            setIsDeleteModalOpen(false);
            loadEmployees();
        } catch (error) {
            toast.error('Failed to deactivate employee');
        }
    };

    const openEditModal = (employee) => {
        setSelectedEmployee(employee);
        setEmployeeForm({
            name: employee.name,
            phone: employee.phone || '',
            job_function: employee.job_function || '',
            monthly_salary: employee.monthly_salary || '',
            hire_date: employee.hire_date || '',
            status: employee.status || 'ACTIVE'
        });
        setIsEditModalOpen(true);
    };

    const openPayModal = (employee) => {
        setSelectedEmployee(employee);
        setPaymentData({
            amount: employee.monthly_salary || '',
            month: new Date().toISOString().slice(0, 7), // YYYY-MM
            account_id: accounts?.[0]?.id || '',
            payment_date: new Date().toISOString().split('T')[0]
        });
        setIsPayModalOpen(true);
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        try {
            await createSalaryPayment({ ...paymentData, employee_id: selectedEmployee.id });
            // Simulate backend dynamic receipt code
            const mockReceiptCode = `REC-SAL-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`;
            toast.success(`Salary Payment recorded. Receipt ${mockReceiptCode} generated.`);
            setIsPayModalOpen(false);
        } catch (error) {
            toast.error('Failed to pay salary');
        }
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Employees</h1>
                    <p className="text-gray-500 text-sm">Manage staff, salaries, and payments</p>
                </div>
                <button
                    onClick={() => {
                        setEmployeeForm(initialFormState);
                        setIsAddModalOpen(true);
                    }}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={20} /> Add Employee
                </button>
            </div>

            <Table headers={['Code', 'Name', 'Job Function', 'Salary', 'Hire Date', 'Status', 'Actions']}>
                {employees.map((employee) => (
                    <TableRow key={employee.id}>
                        <TableCell className="font-mono text-brand-600 font-semibold">{employee.employee_code || 'PENDING'}</TableCell>
                        <TableCell>
                            <div className="font-medium text-gray-800">{employee.name}</div>
                            {employee.phone && <div className="text-xs text-gray-500 flex items-center gap-1"><Phone size={10} /> {employee.phone}</div>}
                        </TableCell>
                        <TableCell>{employee.job_function}</TableCell>
                        <TableCell className="font-mono">{employee.monthly_salary?.toLocaleString()} Fbu</TableCell>
                        <TableCell className="text-sm text-gray-500">{employee.hire_date}</TableCell>
                        <TableCell><StatusBadge status={employee.status} /></TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => { setSelectedEmployee(employee); setIsQRModalOpen(true); }}
                                    className="text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
                                    title="View QR Code"
                                >
                                    <QrCode size={18} />
                                </button>
                                <button
                                    onClick={() => openPayModal(employee)}
                                    className="text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-colors"
                                    title="Pay Salary"
                                >
                                    <DollarSign size={18} />
                                </button>
                                <button
                                    onClick={() => openEditModal(employee)}
                                    className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                                    title="Edit"
                                >
                                    <Edit size={18} />
                                </button>
                                <button
                                    onClick={() => { setSelectedEmployee(employee); setIsDeleteModalOpen(true); }}
                                    className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </Table>

            {/* Add/Edit Employee Modal */}
            <Modal status={isAddModalOpen || isEditModalOpen} isOpen={isAddModalOpen || isEditModalOpen} onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} title={isEditModalOpen ? "Edit Employee" : "New Employee"}>
                <form onSubmit={isEditModalOpen ? handleUpdateEmployee : handleCreateEmployee} className="space-y-4">
                    <div>
                        <label className="label">Full Name</label>
                        <input type="text" required className="input-field" value={employeeForm.name} onChange={e => setEmployeeForm({ ...employeeForm, name: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Phone</label>
                            <input type="text" className="input-field" value={employeeForm.phone} onChange={e => setEmployeeForm({ ...employeeForm, phone: e.target.value })} />
                        </div>
                        <div>
                            <label className="label">Hire Date</label>
                            <input type="date" required className="input-field" value={employeeForm.hire_date} onChange={e => setEmployeeForm({ ...employeeForm, hire_date: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="label">Hire Date</label>
                        <input type="date" required className="input-field" value={employeeForm.hire_date} onChange={e => setEmployeeForm({ ...employeeForm, hire_date: e.target.value })} />
                    </div>
                    <div>
                        <label className="label">Job Function</label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input type="text" className="input-field pl-10" value={employeeForm.job_function} onChange={e => setEmployeeForm({ ...employeeForm, job_function: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Monthly Salary (Fbu)</label>
                            <input type="number" className="input-field" value={employeeForm.monthly_salary} onChange={e => setEmployeeForm({ ...employeeForm, monthly_salary: e.target.value })} />
                        </div>
                        <div>
                            <label className="label">Status</label>
                            <select className="input-field" value={employeeForm.status} onChange={e => setEmployeeForm({ ...employeeForm, status: e.target.value })}>
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                                <option value="SUSPENDED">Suspended</option>
                            </select>
                        </div>
                    </div>
                    <button type="submit" className="w-full btn-primary bg-brand-600 hover:bg-brand-700 mt-4">
                        {isEditModalOpen ? 'Update Employee' : 'Create Employee'}
                    </button>
                </form>
            </Modal>

            {/* Payment Modal */}
            <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title={`Pay Salary: ${selectedEmployee?.name}`}>
                <form onSubmit={handlePayment} className="space-y-4">
                    <div className="bg-rose-50 text-rose-800 p-3 rounded-lg text-sm mb-4">
                        This action will create a Salary Payment record, a Journal Entry (EXIT), and a Payment Receipt.
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Month</label>
                            <input type="month" required className="input-field" value={paymentData.month} onChange={e => setPaymentData({ ...paymentData, month: e.target.value })} />
                        </div>
                        <div>
                            <label className="label">Payment Date</label>
                            <input type="date" required className="input-field" value={paymentData.payment_date} onChange={e => setPaymentData({ ...paymentData, payment_date: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="label">Amount (Fbu)</label>
                        <input type="number" required className="input-field" value={paymentData.amount} onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })} />
                    </div>
                    <div>
                        <label className="label">Pay From Account</label>
                        <select required className="input-field" value={paymentData.account_id} onChange={e => setPaymentData({ ...paymentData, account_id: e.target.value })}>
                            <option value="">Select Account</option>
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" className="w-full btn-primary bg-rose-600 hover:bg-rose-700">Confirm Payment & Generate Receipt</button>
                </form>
            </Modal>

            {/* QR Code Modal */}
            <Modal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} title="Employee QR Code">
                <div className="flex flex-col items-center justify-center p-4">
                    <QRCodeGenerator
                        value={`EMP:${selectedEmployee?.employee_code || selectedEmployee?.id}`}
                        size={200}
                    />
                    <p className="mt-4 text-center text-gray-500">
                        Scan for employee ID verification.
                    </p>
                    <button
                        onClick={() => setIsQRModalOpen(false)}
                        className="mt-6 btn-secondary"
                    >
                        Close
                    </button>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deactivation">
                <p className="text-gray-600 mb-6">Are you sure you want to deactivate <strong>{selectedEmployee?.name}</strong>? This will set their status to INACTIVE.</p>
                <div className="flex gap-4">
                    <button onClick={() => setIsDeleteModalOpen(false)} className="btn-secondary w-full">Cancel</button>
                    <button onClick={handleDeleteEmployee} className="btn-primary bg-red-600 hover:bg-red-700 w-full text-white">Deactivate</button>
                </div>
            </Modal>
        </>
    );
};

export default Employees;
