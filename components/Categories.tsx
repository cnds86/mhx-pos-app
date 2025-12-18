
import React, { useState } from 'react';
import { CategoryItem, Product } from '../types';
import { List, Plus, Trash2, Search, Package, AlertCircle, Edit2, Save, X } from 'lucide-react';

interface CategoriesProps {
  categories: CategoryItem[];
  products: Product[];
  onUpdateCategories: (categories: CategoryItem[]) => void;
}

export const Categories: React.FC<CategoriesProps> = ({ categories, products, onUpdateCategories }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProductCount = (categoryName: string) => {
    return products.filter(p => p.category === categoryName).length;
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    if (categories.some(c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
        alert('ໝວດໝູ່ນີ້ມີແລ້ວ (Category already exists)');
        return;
    }

    onUpdateCategories([
      ...categories,
      { id: Date.now().toString(), name: newCategoryName.trim() }
    ]);
    setNewCategoryName('');
  };

  const handleDeleteCategory = (id: string, name: string) => {
    const count = getProductCount(name);
    if (count > 0) {
      alert(`ບໍ່ສາມາດລຶບໄດ້! ໝວດໝູ່ນີ້ມີສິນຄ້າຢູ່ ${count} ລາຍການ. ກະລຸນາຍ້າຍສິນຄ້າອອກກ່ອນ.`);
      return;
    }

    if (confirm(`ທ່ານຕ້ອງການລຶບໝວດໝູ່ "${name}" ແທ້ບໍ່?`)) {
      onUpdateCategories(categories.filter(c => c.id !== id));
    }
  };

  const startEdit = (cat: CategoryItem) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleUpdateCategory = (id: string) => {
    if (!editName.trim()) return;
    onUpdateCategories(categories.map(c => c.id === id ? { ...c, name: editName.trim() } : c));
    setEditingId(null);
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col animate-fade-in pb-20">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <List className="text-orange-600" />
            ຈັດການໝວດໝູ່ສິນຄ້າ (Categories)
          </h2>
          <p className="text-gray-500 text-sm">ຈັດການ ແລະ ແຍກປະເພດສິນຄ້າພາຍໃນຮ້ານ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add New Category */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-4">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <Plus size={18} className="text-orange-600" />
              ເພີ່ມໝວດໝູ່ໃໝ່
            </h3>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">ຊື່ໝວດໝູ່ (Category Name)</label>
                <input 
                  required
                  type="text" 
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="ຕົວຢ່າງ: ຊີມັງ, ເຫຼັກ..."
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-orange-600 text-white py-3 rounded-xl hover:bg-orange-700 font-bold transition-colors shadow-md shadow-orange-100"
              >
                ບັນທຶກໝວດໝູ່
              </button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-800 flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p>ການແຍກໝວດໝູ່ຈະຊ່ວຍໃຫ້ການຄົ້ນຫາສິນຄ້າໃນໜ້າຂາຍ (POS) ໄດ້ວ່ອງໄວ ແລະ ເບິ່ງລາຍງານແຍກປະເພດໄດ້ຊັດເຈນ.</p>
            </div>
          </div>
        </div>

        {/* Categories List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="ຄົ້ນຫາໝວດໝູ່..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <span className="text-xs font-bold text-gray-500">ທັງໝົດ: {categories.length}</span>
            </div>

            <div className="overflow-auto flex-1">
              <table className="w-full text-left">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase">ໝວດໝູ່</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-center">ສິນຄ້າໃນໝວດ</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCategories.map(cat => {
                    const productCount = getProductCount(cat.name);
                    return (
                      <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          {editingId === cat.id ? (
                            <div className="flex items-center gap-2">
                              <input 
                                autoFocus
                                className="p-1.5 border border-blue-400 rounded outline-none text-sm w-full"
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                onKeyDown={e => {
                                    if(e.key === 'Enter') handleUpdateCategory(cat.id);
                                    if(e.key === 'Escape') cancelEdit();
                                }}
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                                <List size={16} />
                              </div>
                              <span className="font-bold text-gray-800">{cat.name}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-600">
                            <Package size={12} />
                            {productCount}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            {editingId === cat.id ? (
                              <>
                                <button 
                                  onClick={() => handleUpdateCategory(cat.id)}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                                  title="Save"
                                >
                                  <Save size={18} />
                                </button>
                                <button 
                                  onClick={cancelEdit}
                                  className="p-1.5 text-gray-400 hover:bg-gray-50 rounded"
                                  title="Cancel"
                                >
                                  <X size={18} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button 
                                  onClick={() => startEdit(cat)}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                  title="Edit"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                  title="Delete"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredCategories.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center py-20 text-gray-400">
                        ບໍ່ພົບໝວດໝູ່ສິນຄ້າ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
