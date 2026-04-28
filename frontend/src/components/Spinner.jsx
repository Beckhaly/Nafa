export default function Spinner({ size = 'md' }) {
  const s = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }[size]
  return (
    <div className="flex justify-center items-center py-8">
      <div className={`${s} animate-spin rounded-full border-2 border-blue-600 border-t-transparent`} />
    </div>
  )
}
