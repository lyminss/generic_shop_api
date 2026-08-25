import { useState, useEffect } from 'react';
import { X, Plus, CheckCircle2, Loader2, Image as ImageIcon } from 'lucide-react';

const AdminProductModal = ({ isOpen, onClose, onSave, editingProduct, submitting }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    stockQuantity: '',
    image: '',
    description: '',
  });

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name || '',
        category: editingProduct.category || '',
        price: editingProduct.price || '',
        stockQuantity: editingProduct.stockQuantity ?? 100,
        image: editingProduct.image || '',
        description: editingProduct.description || '',
      });
    } else {
      setFormData({
        name: '',
        category: 'Trà Sữa',
        price: '',
        stockQuantity: 100,
        image: '',
        description: '',
      });
    }
  }, [editingProduct, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-stone-200/90 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-stone-100 bg-stone-50/90">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-800 flex items-center justify-center font-black text-xl shadow-2xs">
              {editingProduct ? '✏️' : '✨'}
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-stone-900 tracking-tight">
                {editingProduct ? 'Chỉnh sửa món ăn' : 'Thêm món ăn mới'}
              </h3>
              <p className="text-xs text-stone-500 font-medium mt-0.5">
                {editingProduct ? `Cập nhật thông tin món #${editingProduct.id}` : 'Nhập thông tin chi tiết vào thực đơn quán'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/70 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* Tên món */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 mb-2">
              Tên món ăn <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all shadow-2xs"
              placeholder="Ví dụ: Trà Sữa Matcha Uji Nhật Bản"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Danh mục & Giá bán */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 mb-2">
                Danh mục món
              </label>
              <input
                type="text"
                className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all shadow-2xs"
                placeholder="Ví dụ: Trà Sữa, Cà Phê, Trà Trái Cây"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 mb-2">
                Giá bán (VND) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="1000"
                className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-bold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all shadow-2xs"
                placeholder="35000"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
          </div>

          {/* Tồn kho & URL Ảnh */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 mb-2">
                Suất phục vụ mặc định
              </label>
              <input
                type="number"
                min="0"
                className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all shadow-2xs"
                placeholder="100"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 mb-2">
                Đường dẫn hình ảnh (URL)
              </label>
              <input
                type="url"
                className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all shadow-2xs"
                placeholder="https://images.unsplash.com/..."
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              />
            </div>
          </div>

          {/* Image Preview if provided */}
          {formData.image && (
            <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-200 shadow-2xs">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-stone-200 flex-shrink-0 border border-stone-300">
                <img
                  src={formData.image}
                  alt="Xem trước món"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
              <div className="min-w-0 text-xs">
                <p className="font-bold text-stone-800 flex items-center gap-1.5 text-sm">
                  <ImageIcon size={16} className="text-stone-500" /> Xem trước ảnh món
                </p>
                <p className="text-stone-400 truncate max-w-sm mt-0.5">{formData.image}</p>
              </div>
            </div>
          )}

          {/* Mô tả món */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 mb-2">
              Mô tả chi tiết món ăn
            </label>
            <textarea
              rows={3}
              className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all resize-none shadow-2xs leading-relaxed"
              placeholder="Thành phần hương vị, độ ngọt, mức đá, sữa đặc biệt..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3.5 rounded-2xl border border-stone-300 text-stone-700 text-sm font-bold hover:bg-stone-100 transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3.5 bg-stone-900 hover:bg-stone-800 text-white text-sm font-extrabold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center gap-2.5 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang lưu...
                </>
              ) : editingProduct ? (
                <>
                  <CheckCircle2 size={17} />
                  Lưu thay đổi
                </>
              ) : (
                <>
                  <Plus size={17} />
                  Thêm món mới
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProductModal;
