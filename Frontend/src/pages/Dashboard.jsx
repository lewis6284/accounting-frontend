import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp,
    TrendingDown,
    Users,
    Activity,
    AlertCircle,
    PlusCircle,
    Wallet,
    UserPlus,
    CreditCard
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getManualRevenues, getAutomaticRevenues } from '../services/revenueService';
import { getExpenses } from '../services/expenseService';
import { getCandidates } from '../services/candidateService';
import { getCandidatePayments, getSalaryPayments } from '../services/paymentService';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        revenue: 0,
        expenses: 0,
        candidates: 0,
        pendingCandidates: 0
    });
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [
                    manualRev,
                    autoRev,
                    expensesData,
                    candidatesData,
                    candidatePayments,
                    salaryPayments
                ] = await Promise.all([
                    getManualRevenues(),
                    getAutomaticRevenues(),
                    getExpenses(),
                    getCandidates(),
                    getCandidatePayments(),
                    getSalaryPayments()
                ]);

                // Calculate Totals
                const totalManualRevenue = manualRev.reduce((sum, item) => sum + Number(item.amount || 0), 0);
                const totalAutoRevenue = autoRev.reduce((sum, item) => sum + Number(item.amount || 0), 0);
                // Assume Candidate Payments are also Revenue if not included in Automatic
                const totalCandidatePayments = candidatePayments.reduce((sum, item) => sum + Number(item.amount || 0), 0);

                const totalRevenue = totalManualRevenue + (autoRev.length > 0 ? totalAutoRevenue : totalCandidatePayments);

                const totalExpenses = expensesData.reduce((sum, item) => sum + Number(item.amount || 0), 0);
                const totalSalaries = salaryPayments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
                const allExpenses = totalExpenses + totalSalaries;

                // Candidates
                const totalCandidates = candidatesData.length;
                const pending = candidatesData.filter(c => c.status === 'PENDING').length;

                setStats({
                    revenue: totalRevenue,
                    expenses: allExpenses,
                    candidates: totalCandidates,
                    pendingCandidates: pending
                });

                // Prepare Chart Data (Last 6 months)
                const processChartData = () => {
                    const months = {};
                    const today = new Date();
                    for (let i = 5; i >= 0; i--) {
                        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                        const monthName = d.toLocaleString('default', { month: 'short' });
                        months[monthName] = { name: monthName, revenue: 0, expenses: 0 };
                    }

                    const addToMonth = (dateStr, amount, type) => {
                        if (!dateStr) return;
                        const date = new Date(dateStr);
                        if (isNaN(date.getTime())) return;

                        const monthName = date.toLocaleString('default', { month: 'short' });
                        if (months[monthName]) {
                            months[monthName][type] += Number(amount);
                        }
                    };

                    manualRev.forEach(r => addToMonth(r.date || r.created_at, r.amount, 'revenue'));
                    candidatePayments.forEach(r => addToMonth(r.payment_date || r.created_at, r.amount, 'revenue'));

                    expensesData.forEach(e => addToMonth(e.date || e.created_at, e.amount, 'expenses'));
                    salaryPayments.forEach(s => addToMonth(s.payment_date || s.created_at, s.amount, 'expenses'));

                    return Object.values(months);
                };

                setChartData(processChartData());

                // Recent Transactions
                const allTransactions = [
                    ...manualRev.map(i => ({ ...i, type: 'revenue', label: 'Manual Revenue', date: i.date || i.created_at })),
                    ...candidatePayments.map(i => ({ ...i, type: 'revenue', label: 'Candidate Payment', date: i.payment_date || i.created_at })),
                    ...expensesData.map(i => ({ ...i, type: 'expense', label: 'Expense', date: i.date || i.created_at })),
                    ...salaryPayments.map(i => ({ ...i, type: 'expense', label: 'Salary Payment', date: i.payment_date || i.created_at }))
                ].sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 5);

                setRecentTransactions(allTransactions);
                setLoading(false);

            } catch (error) {
                console.error("Dashboard fetch error:", error);
                toast.error("Failed to load dashboard data");
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500">Financial Overview & Recent Activity</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardCard
                    title="Total Revenue"
                    value={`$${stats.revenue.toLocaleString()}`}
                    icon={TrendingUp}
                    color="emerald"
                />
                <DashboardCard
                    title="Total Expenses"
                    value={`$${stats.expenses.toLocaleString()}`}
                    icon={TrendingDown}
                    color="rose"
                />
                <DashboardCard
                    title="Total Candidates"
                    value={stats.candidates}
                    icon={Users}
                    color="blue"
                />
                <DashboardCard
                    title="Pending Approvals"
                    value={stats.pendingCandidates}
                    icon={AlertCircle}
                    color="amber"
                />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button onClick={() => navigate('/revenues')} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2 group">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full group-hover:bg-emerald-100 transition-colors">
                        <PlusCircle size={24} />
                    </div>
                    <span className="font-semibold text-gray-700 text-sm">Add Revenue</span>
                </button>
                <button onClick={() => navigate('/expenses')} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2 group">
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-full group-hover:bg-rose-100 transition-colors">
                        <Wallet size={24} />
                    </div>
                    <span className="font-semibold text-gray-700 text-sm">Add Expense</span>
                </button>
                <button onClick={() => navigate('/candidates')} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2 group">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-full group-hover:bg-blue-100 transition-colors">
                        <UserPlus size={24} />
                    </div>
                    <span className="font-semibold text-gray-700 text-sm">New Candidate</span>
                </button>
                <button onClick={() => navigate('/payments')} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2 group">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-full group-hover:bg-purple-100 transition-colors">
                        <CreditCard size={24} />
                    </div>
                    <span className="font-semibold text-gray-700 text-sm">Process Payment</span>
                </button>
            </div>

            {/* Charts & Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-96">
                    <h3 className="font-bold text-gray-800 mb-6">Revenue vs Expenses (Last 6 Months)</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                            <CartesianGrid vertical={false} stroke="#E5E7EB" strokeDasharray="3 3" />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="#10B981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                            <Area type="monotone" dataKey="expenses" stroke="#F43F5E" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-full max-h-96 overflow-hidden flex flex-col">
                    <h3 className="font-bold text-gray-800 mb-4 shrink-0">Recent Transactions</h3>
                    <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                        {recentTransactions.map((t, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg shrink-0 ${t.type === 'revenue' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                        <Activity size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate pr-2">{t.label}</p>
                                        <p className="text-xs text-gray-500">{new Date(t.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <span className={`font-bold text-sm whitespace-nowrap ${t.type === 'revenue' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {t.type === 'revenue' ? '+' : '-'}${Number(t.amount).toLocaleString()}
                                </span>
                            </div>
                        ))}
                        {recentTransactions.length === 0 && (
                            <div className="h-full flex items-center justify-center">
                                <p className="text-center text-gray-400 text-sm">No recent transactions</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const DashboardCard = ({ title, value, icon: Icon, color }) => {
    const colorClasses = {
        emerald: 'bg-emerald-100 text-emerald-600',
        rose: 'bg-rose-100 text-rose-600',
        blue: 'bg-blue-100 text-blue-600',
        amber: 'bg-amber-100 text-amber-600',
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
                    <Icon size={24} />
                </div>
            </div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
            <div className="text-2xl font-black text-gray-900">{value}</div>
        </div>
    );
};

export default Dashboard;
