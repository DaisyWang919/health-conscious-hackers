// Shared theme configuration
export const theme = {
  colors: {
    blue: {
      primary: 'bg-blue-500 hover:bg-blue-600 text-white',
      secondary: 'bg-blue-50 hover:bg-blue-100 text-blue-600',
      outline: 'border border-blue-200 hover:bg-blue-50 text-blue-600',
      focus: 'focus:ring-blue-500',
      selected: 'bg-blue-50',
      icon: 'text-blue-500'
    },
    green: {
      primary: 'bg-green-500 hover:bg-green-600 text-white',
      secondary: 'bg-green-50 hover:bg-green-100 text-green-600',
      outline: 'border border-green-200 hover:bg-green-50 text-green-600',
      focus: 'focus:ring-green-500',
      selected: 'bg-green-50',
      icon: 'text-green-500'
    },
    purple: {
      primary: 'bg-purple-500 hover:bg-purple-600 text-white',
      secondary: 'bg-purple-50 hover:bg-purple-100 text-purple-600',
      outline: 'border border-purple-200 hover:bg-purple-50 text-purple-600',
      focus: 'focus:ring-purple-500',
      selected: 'bg-purple-50',
      icon: 'text-purple-500'
    },
    gray: {
      primary: 'bg-gray-500 hover:bg-gray-600 text-white',
      secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-600',
      outline: 'border border-gray-200 hover:bg-gray-50 text-gray-600',
      focus: 'focus:ring-gray-500',
      selected: 'bg-gray-50',
      icon: 'text-gray-500'
    }
  },
  components: {
    card: 'bg-white rounded-lg border border-gray-200 p-6 shadow-md',
    input: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2',
    label: 'block text-gray-700 font-medium mb-2',
    helperText: 'text-sm text-gray-500 mt-1',
    errorText: 'text-sm text-red-600 mt-1'
  }
} as const;