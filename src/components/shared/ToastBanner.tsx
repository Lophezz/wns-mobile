import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, AlertCircle, AlertTriangle, X } from 'lucide-react-native';
import { useToastStore } from '../../store/toast-store';

export function ToastBanner() {
  const insets = useSafeAreaInsets();
  const { visible, type, title, message, hideToast } = useToastStore();

  if (!visible) return null;

  const config = {
    success: {
      bg: 'bg-emerald-950',
      border: 'border-emerald-500',
      icon: <CheckCircle2 size={22} color="#10b981" />,
    },
    error: {
      bg: 'bg-red-950',
      border: 'border-red-500',
      icon: <AlertCircle size={22} color="#ef4444" />,
    },
    warning: {
      bg: 'bg-amber-950',
      border: 'border-amber-400',
      icon: <AlertTriangle size={22} color="#fbbf24" />,
    },
  }[type];

  return (
    <View
      style={{ top: Math.max(insets.top + 8, 16), zIndex: 99999, elevation: 99 }}
      className="absolute left-4 right-4"
    >
      <View
        className={`${config.bg} border-l-4 ${config.border} rounded-2xl p-4 shadow-xl flex-row items-center`}
      >
        <View className="mr-3">{config.icon}</View>
        <View className="flex-1">
          <Text className="text-white font-poppins-bold text-sm">{title}</Text>
          {!!message && (
            <Text className="text-gray-200 font-poppins text-xs mt-0.5 leading-4">
              {message}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={hideToast} className="p-1.5 ml-2">
          <X size={18} color="#9ca3af" />
        </TouchableOpacity>
      </View>
    </View>
  );
}