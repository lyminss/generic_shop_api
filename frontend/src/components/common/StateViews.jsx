import React from 'react';
import { AlertTriangle, RefreshCw, Inbox, Sparkles } from 'lucide-react';

/**
 * Skeleton Loader for Tables
 */
export const TableSkeleton = ({ rows = 5, cols = 5 }) => (
  <>
    {Array.from({ length: rows }).map((_, rIdx) => (
      <tr key={rIdx} className="animate-pulse">
        {Array.from({ length: cols }).map((_, cIdx) => (
          <td key={cIdx} className="py-4 px-3">
            <div className="skeleton-loader h-4 w-full rounded" />
          </td>
        ))}
      </tr>
    ))}
  </>
);

/**
 * Skeleton Loader for Grid Cards
 */
export const CardSkeleton = ({ count = 3 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
    {Array.from({ length: count }).map((_, idx) => (
      <div key={idx} className="p-4 rounded-2xl border border-stone-200 bg-white space-y-3 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="skeleton-loader h-5 w-24 rounded" />
          <div className="skeleton-loader h-4 w-16 rounded-full" />
        </div>
        <div className="skeleton-loader h-4 w-3/4 rounded" />
        <div className="skeleton-loader h-12 w-full rounded-xl" />
        <div className="flex justify-between items-center pt-2">
          <div className="skeleton-loader h-5 w-20 rounded" />
          <div className="skeleton-loader h-8 w-24 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Empty State Component with tip and optional action
 */
export const EmptyState = ({
  title = 'Không có dữ liệu',
  description = 'Hiện tại chưa có thông tin nào trong danh sách này.',
  icon: Icon = Inbox,
  actionText,
  onAction,
}) => (
  <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl bg-stone-50 border border-dashed border-stone-300 w-full animate-fade-in">
    <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 shadow-sm">
      <Icon size={32} />
    </div>
    <h3 className="text-lg font-bold text-stone-800 mb-1">{title}</h3>
    <p className="text-sm text-stone-500 max-w-sm mb-5 leading-relaxed">{description}</p>
    {actionText && onAction && (
      <button
        onClick={onAction}
        className="btn-brand text-xs font-semibold px-5 py-2.5 rounded-full flex items-center gap-2"
      >
        <Sparkles size={14} />
        {actionText}
      </button>
    )}
  </div>
);

/**
 * Error State Component with Retry button
 */
export const ErrorState = ({
  title = 'Không thể tải dữ liệu',
  message = 'Đã xảy ra lỗi khi kết nối máy chủ. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại.',
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-rose-50/60 border border-rose-200 w-full animate-fade-in my-4">
    <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
      <AlertTriangle size={28} />
    </div>
    <h3 className="text-base font-bold text-rose-900 mb-1">{title}</h3>
    <p className="text-xs text-rose-700 max-w-md mb-4">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
      >
        <RefreshCw size={14} />
        Thử lại ngay
      </button>
    )}
  </div>
);
