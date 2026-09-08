import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ChefHat,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  TrendingUp,
  Cpu,
  RefreshCw,
  Layers,
  ArrowRight,
  Play,
  RotateCcw,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { capacityService, productService } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { formatPrice } from '../../../utils/format';

const ProductionCapacityModal = ({ isOpen, onClose }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'simulation'
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  // Simulation State
  const [products, setProducts] = useState([]);
  const [simulationItems, setSimulationItems] = useState({});
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);

  const fetchCapacity = async () => {
    setLoading(true);
    try {
      const [resCap, resProd] = await Promise.all([
        capacityService.getOverview(),
        productService.getAll(),
      ]);
      setData(resCap.data);
      setProducts(resProd.data || []);
    } catch (err) {
      toast.error('Không thể tải phân tích công suất kho');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCapacity();
      setSimulationResult(null);
      setSimulationItems({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSimQuantityChange = (productId, qty) => {
    const val = parseInt(qty, 10);
    setSimulationItems((prev) => {
      const updated = { ...prev };
      if (isNaN(val) || val <= 0) {
        delete updated[productId];
      } else {
        updated[productId] = val;
      }
      return updated;
    });
  };

  const handleRunSimulation = async () => {
    const items = Object.entries(simulationItems).map(([pId, q]) => ({
      productId: Number(pId),
      quantity: Number(q),
    }));

    if (items.length === 0) {
      toast.error('Vui lòng nhập số lượng cho ít nhất 1 món để mô phỏng');
      return;
    }

    setSimulating(true);
    try {
      const res = await capacityService.simulate({ items });
      setSimulationResult(res.data);
      toast.success('Mô phỏng thành công');
    } catch (err) {
      toast.error(err.response?.data || 'Không thể chạy mô phỏng');
    } finally {
      setSimulating(false);
    }
  };

  const handleResetSimulation = () => {
    setSimulationItems({});
    setSimulationResult(null);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-stone-100 bg-stone-50/90 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-800 flex items-center justify-center font-black text-xl shadow-2xs">
              <Cpu size={24} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100/70 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider mb-0.5">
                <Sparkles size={11} /> Thuật toán tối ưu hóa kho
              </div>
              <h3 className="text-xl font-extrabold text-stone-900 tracking-tight">
                Ước Tính & Tối Ưu Công Suất Pha Chế Từ Kho
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchCapacity}
              className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 transition-colors"
              title="Tính toán lại dữ liệu mới nhất"
            >
              <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/70 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-8 border-b border-stone-100 bg-white gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-5 py-3 text-xs font-extrabold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'overview'
                ? 'border-amber-600 text-amber-900 bg-amber-50/50'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            📊 Khả năng phục vụ & Điểm nghẽn
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('simulation')}
            className={`px-5 py-3 text-xs font-extrabold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'simulation'
                ? 'border-amber-600 text-amber-900 bg-amber-50/50'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            🧪 Mô phỏng pha chế theo ca
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {loading && !data ? (
            <div className="py-24 text-center">
              <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-stone-600">
                Đang chạy thuật toán phân tích ma trận nguyên liệu & công thức...
              </p>
            </div>
          ) : activeTab === 'overview' ? (
            <>
              {/* 4 Metrics Highlight */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {/* Total Combined */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-100">
                      Công suất đồng thời
                    </span>
                    <ChefHat size={18} className="text-amber-200" />
                  </div>
                  <h4 className="text-3xl font-black">
                    {data?.totalCombinedMaxServings ?? 0}{' '}
                    <span className="text-sm font-semibold">ly</span>
                  </h4>
                  <p className="text-[11px] text-amber-100 mt-1">
                    Toàn quán có thể làm cùng lúc với kho hiện tại
                  </p>
                </div>

                {/* Sẵn sàng */}
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
                      Món đủ nguyên liệu
                    </span>
                    <CheckCircle2 size={18} className="text-emerald-600" />
                  </div>
                  <h4 className="text-3xl font-black text-emerald-900">
                    {data?.readyToServeProducts ?? 0}
                  </h4>
                  <p className="text-[11px] text-emerald-700 mt-1">
                    Có thể pha chế ngay lập tức
                  </p>
                </div>

                {/* Hết nguyên liệu */}
                <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-800">
                      Hết hàng / Hết NL
                    </span>
                    <AlertTriangle size={18} className="text-rose-600" />
                  </div>
                  <h4 className="text-3xl font-black text-rose-900">
                    {data?.outOfStockProducts ?? 0}
                  </h4>
                  <p className="text-[11px] text-rose-700 mt-1">
                    Cần nhập thêm nguyên liệu
                  </p>
                </div>

                {/* Ngừng bán */}
                <div className="p-5 rounded-2xl bg-stone-100 border border-stone-200">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-600">
                      Đang ngừng bán
                    </span>
                    <Layers size={18} className="text-stone-500" />
                  </div>
                  <h4 className="text-3xl font-black text-stone-800">
                    {data?.stoppedProducts ?? 0}
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Danh mục đóng hoặc món tắt
                  </p>
                </div>
              </div>

              {/* Top Bottlenecks Section */}
              {data?.bottlenecks && data.bottlenecks.length > 0 && (
                <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={17} className="text-amber-700" />
                    <h4 className="text-sm font-extrabold text-amber-900">
                      Nguyên Liệu Điểm Nghẽn (Bottlenecks) Đang Kìm Hãm Thực Đơn
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {data.bottlenecks.slice(0, 3).map((b) => (
                      <div
                        key={b.ingredientId}
                        className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-extrabold text-stone-900 text-xs truncate max-w-[140px]">
                            {b.name}
                          </span>
                          <span className="font-mono text-[11px] font-bold text-stone-500">
                            {b.currentStock} {b.unit}
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-600 flex justify-between items-center mt-2 pt-2 border-t border-stone-100">
                          <span>Dùng trong {b.dishesDependentCount} món</span>
                          {b.dishesBlockedCount > 0 && (
                            <span className="text-rose-700 font-extrabold bg-rose-50 px-1.5 py-0.5 rounded">
                              Làm nghẽn {b.dishesBlockedCount} món
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Table of Dish Capacities */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
                    <Boxes size={16} className="text-amber-700" />
                    Khả Năng Pha Chế Tối Đa Từng Món (Độc Lập)
                  </h4>
                  <span className="text-xs text-stone-500">
                    *Giả định dồn toàn bộ kho nguyên liệu cho từng món riêng lẻ
                  </span>
                </div>

                <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 text-stone-700 font-extrabold border-b border-stone-200">
                      <tr>
                        <th className="py-3 px-4">Món ăn</th>
                        <th className="py-3 px-4">Danh mục</th>
                        <th className="py-3 px-4 text-center">Số ly tối đa từ kho</th>
                        <th className="py-3 px-4">Nguyên liệu giới hạn (Bottleneck)</th>
                        <th className="py-3 px-4">Tình trạng phục vụ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {data?.dishCapacities?.map((dish) => {
                        const isStopped = dish.status === 'STOPPED';
                        const isExpired = dish.statusTag === 'EXPIRED_INGREDIENT';
                        const isZero = dish.maxPossibleServings === 0;

                        return (
                          <tr key={dish.productId} className="hover:bg-stone-50/70">
                            <td className="py-3 px-4">
                              <span className="font-extrabold text-stone-900">
                                {dish.productName}
                              </span>
                              <span className="block text-[11px] text-stone-400">
                                #{dish.productId} · {formatPrice(dish.price)}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-md bg-stone-100 font-semibold text-stone-700">
                                {dish.category}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-center">
                              {isStopped ? (
                                <span className="text-stone-400 font-bold">-</span>
                              ) : (
                                <span
                                  className={`inline-block px-2.5 py-1 rounded-lg font-mono font-black text-sm ${
                                    dish.maxPossibleServings >= 20
                                      ? 'bg-emerald-100 text-emerald-900'
                                      : dish.maxPossibleServings >= 5
                                      ? 'bg-amber-100 text-amber-900'
                                      : 'bg-rose-100 text-rose-900'
                                  }`}
                                >
                                  {dish.maxPossibleServings} ly
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              {dish.limitingIngredientName ? (
                                <div>
                                  <span className="font-semibold text-stone-800">
                                    {dish.limitingIngredientName}
                                  </span>
                                  <span className="block text-[11px] text-stone-400">
                                    Cần {dish.limitingRequiredPerServing} {dish.limitingIngredientUnit}/ly · Còn {dish.limitingAvailableStock} {dish.limitingIngredientUnit}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-stone-400 italic">Không có công thức</span>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              {isStopped ? (
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-stone-200 text-stone-600">
                                  Ngừng bán
                                </span>
                              ) : isExpired ? (
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-700">
                                  Hết hạn NL
                                </span>
                              ) : isZero ? (
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-700">
                                  Hết hàng
                                </span>
                              ) : dish.maxPossibleServings < 5 ? (
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800">
                                  Sắp hết
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800">
                                  Sẵn sàng
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            /* Simulation Tab */
            <div className="space-y-6">
              <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
                <strong>🧪 Bộ mô phỏng sản xuất theo ca:</strong> Nhập số lượng ly dự kiến bán cho từng món. Hệ thống sẽ áp dụng ma trận công thức tiêu hao và trừ thử vào kho nguyên liệu thực tế để dự báo tính khả thi và số nguyên liệu dư/thiếu.
              </div>

              {/* Product Inputs Grid */}
              <div className="border border-stone-200 rounded-2xl p-5 bg-stone-50/50">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-700 mb-4 flex items-center justify-between">
                  <span>Nhập số lượng dự kiến pha chế:</span>
                  <button
                    type="button"
                    onClick={handleResetSimulation}
                    className="text-stone-500 hover:text-stone-800 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <RotateCcw size={13} /> Đặt lại
                  </button>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1">
                  {products
                    .filter((p) => p.status !== 'STOPPED')
                    .map((p) => {
                      const qty = simulationItems[p.id] || '';
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-white border border-stone-200"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-extrabold text-stone-900 text-xs truncate">
                              {p.name}
                            </p>
                            <span className="text-[10px] text-stone-400">
                              {p.category} · {formatPrice(p.price)}
                            </span>
                          </div>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            className="w-16 px-2.5 py-1.5 border border-stone-200 rounded-lg text-center font-bold text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                            value={qty}
                            onChange={(e) => handleSimQuantityChange(p.id, e.target.value)}
                          />
                        </div>
                      );
                    })}
                </div>

                <div className="flex justify-end mt-4">
                  <button
                    type="button"
                    onClick={handleRunSimulation}
                    disabled={simulating}
                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Play size={14} /> Chạy Mô Phỏng Dự Báo
                  </button>
                </div>
              </div>

              {/* Simulation Result Display */}
              {simulationResult && (
                <div className="animate-fade-in space-y-4">
                  {/* Status Banner */}
                  <div
                    className={`p-5 rounded-2xl border flex items-center gap-3 ${
                      simulationResult.isFeasible
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-rose-50 border-rose-300 text-rose-900'
                    }`}
                  >
                    {simulationResult.isFeasible ? (
                      <CheckCircle2 size={24} className="text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertTriangle size={24} className="text-rose-600 flex-shrink-0" />
                    )}
                    <div>
                      <h4 className="font-black text-sm">
                        {simulationResult.isFeasible
                          ? '✅ KHO ĐỦ NGUYÊN LIỆU PHỤC VỤ KẾ HOẠCH NÀY!'
                          : '⚠️ KHÔNG ĐỦ NGUYÊN LIỆU PHỤC VỤ KẾ HOẠCH NÀY!'}
                      </h4>
                      <p className="text-xs mt-0.5 opacity-90">
                        {simulationResult.isFeasible
                          ? `Toàn bộ ${simulationResult.totalRequestedServings} ly đồ uống đều có đầy đủ nguyên liệu đáp ứng chuẩn định lượng.`
                          : `Kho đang bị thiếu hụt một số nguyên liệu. Vui lòng nhập thêm trước khi bắt đầu ca.`}
                      </p>
                    </div>
                  </div>

                  {/* Consumptions Table */}
                  <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white">
                    <div className="px-5 py-3 bg-stone-50 border-b border-stone-200 font-extrabold text-xs text-stone-800">
                      Bảng Dự Báo Tiêu Hao Nguyên Liệu
                    </div>
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50/50 text-stone-500 font-bold border-b border-stone-100">
                        <tr>
                          <th className="py-2.5 px-4">Nguyên liệu</th>
                          <th className="py-2.5 px-4 text-center">Cần dùng</th>
                          <th className="py-2.5 px-4 text-center">Tồn kho hiện có</th>
                          <th className="py-2.5 px-4 text-center">Tồn kho còn lại</th>
                          <th className="py-2.5 px-4 text-right">Tình trạng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {simulationResult.consumptions?.map((c) => (
                          <tr key={c.ingredientId}>
                            <td className="py-2.5 px-4 font-bold text-stone-800">
                              {c.name}{' '}
                              <span className="font-normal text-stone-400 font-mono text-[10px]">
                                ({c.code})
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono">
                              {c.consumedQuantity.toFixed(2)} {c.unit}
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono">
                              {c.initialStock} {c.unit}
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono font-black text-stone-900">
                              {c.remainingStock.toFixed(2)} {c.unit}
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              {c.isDeficient ? (
                                <span className="font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                                  Thiếu {c.deficientQuantity.toFixed(2)} {c.unit}
                                </span>
                              ) : (
                                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                  Đủ hàng
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-8 py-4 border-t border-stone-100 bg-stone-50 flex items-center justify-between text-xs text-stone-500 flex-shrink-0">
          <span>MinTea Warehouse Intelligence</span>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProductionCapacityModal;
