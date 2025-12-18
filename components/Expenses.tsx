import React, { useState } from 'react';
import { ExpenseRecord } from '../types';
import { FORMAT_CURRENCY } from '../constants';
import { Plus, Search, Trash2, Save, X, Wallet, Calendar, FileText, TrendingDown, AlertTriangle } from 'lucide-react';

interface ExpensesProps {
  expenses: ExpenseRecord[];
  onAddExpense: (expense: ExpenseRecord) => void;
  onDeleteExpense: (id: string) => void;
}

export const Expenses: React.FC<ExpensesProps> = ({ expenses, onAddExpense, onDeleteExpense }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemToDelete, setItemToDelete] = useState<ExpenseRecord | null>(null);
  
  const [formData, setFormData] = useState<Partial<ExpenseRecord>>({
    category: 'OTHER',
    amount: 0,
    note: ''
  });

  const categoryLabels: Record<string, string> = {
    'RENT': 'ຄ່າເຊົ່າ (Rent)',
    'UTILITIES': 'ຄ່ານ້ຳ/ໄຟ (Utilities)',
    'SALARY': 'ເງິນເດືອນ (Salary)',
    'MARKETING': 'ການຕະຫຼາດ (Marketing)',
    'MAINTENANCE': 'ສ້ອມແປງ (Maintenance)',
    'OTHER': 'ອື່ນໆ (Other)'
  };

  const filteredExpenses = expenses
    .filter(e => 
      e.note?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      categoryLabels[e.category].toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount) return;

    const newExpense: ExpenseRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      category: formData.category as any,
      amount: Number(formData.amount),
      note: formData.note
    };

    onAddExpense(newExpense);
    setFormData({ category: 'OTHER', amount: 0, note: '' });
    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      onDeleteExpense(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">ລາຍຈ່າຍ (Expenses)</h2>
          <p className="text-gray-500 text-sm">ບັນທຶກຄ່າໃຊ້ຈ່າຍຕ່າງໆໃນຮ້ານ</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span className="hidden md:inline">ບັນທຶກລາຍຈ່າຍ</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
        {/* Header Stats & Search */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ຄົ້ນຫາລາຍຈ່າຍ..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm border border-red-100">
             <TrendingDown size={20} />
             ລວມລາຍຈ່າຍ: {FORMAT_CURRENCY(totalExpenses)}
          </div>
        </div>

        {/* List View */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-left">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="p-4 text-sm font-semibold text-gray-600">ວັນທີ</th>
                <th className="p-4 text-sm font-semibold text-gray-600">ປະເພດ</th>
                <th className="p-4 text-sm font-semibold text-gray-600">ລາຍລະອຽດ</th>
                <th className="p-4 text-sm font-semibold text-gray-600 text-right">ຈຳນວນເງິນ</th>
                <th className="p-4 text-sm font-semibold text-gray-600 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredExpenses.map(expense => (
                <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-sm text-gray-600 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                       <Calendar size={14} className="text-gray-400" />
                       {new Date(expense.date).toLocaleDateString('lo-LA')}
                    </div>
                  </td>
                  <td className="p-4 text-sm">
                    <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold border border-gray-200">
                      {categoryLabels[expense.category]}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600 max-w-xs truncate">
                    {expense.note || '-'}
                  </td>
                  <td className="p-4 font-bold text-gray-800 text-right text-red-600">
                    -{FORMAT_CURRENCY(expense.amount)}
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => setItemToDelete(expense)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    <Wallet size={48} className="mx-auto mb-2 opacity-50" />
                    <p>ບໍ່ພົບລາຍການລາຍຈ່າຍ</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">ບັນທຶກລາຍຈ່າຍໃໝ່</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ປະເພດລາຍຈ່າຍ</label>
                <div className="relative">
                   <select
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value as any})}
                  >
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ຈຳນວນເງິນ (ກີບ)</label>
                <input
                  required
                  type="number"
                  min="0"
                  autoFocus
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-red-600"
                  placeholder="0"
                  value={formData.amount || ''}
                  onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ໝາຍເຫດ / ລາຍລະອຽດ</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
                  <textarea
                    className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    rows={3}
                    placeholder="ລາຍລະອຽດເພີ່ມເຕີມ..."
                    value={formData.note}
                    onChange={e => setFormData({...formData, note: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 flex justify-center items-center gap-2 font-medium"
                >
                  <Save size={18} />
                  ບັນທຶກ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">ຢືນຢັນການລຶບ?</h3>
              <p className="text-gray-500 text-sm mb-6">
                ທ່ານຕ້ອງການລຶບລາຍຈ່າຍນີ້ແທ້ບໍ່? ລາຍການນີ້ຈະຖືກລຶບອອກຈາກລະບົບຖາວອນ.
              </p>
              <div className="bg-gray-50 p-3 rounded-lg mb-6 border border-gray-100 text-left">
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">ລາຍລະອຽດລາຍຈ່າຍ:</p>
                <p className="text-sm font-bold text-gray-800">{categoryLabels[itemToDelete.category]}</p>
                <p className="text-sm text-red-600 font-bold">{FORMAT_CURRENCY(itemToDelete.amount)}</p>
                {itemToDelete.note && <p className="text-xs text-gray-500 mt-1 italic line-clamp-1">"{itemToDelete.note}"</p>}
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 font-bold transition-colors"
                >
                  ຍົກເລີກ
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold transition-colors shadow-lg shadow-red-100"
                >
                  ລຶບລາຍການ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};