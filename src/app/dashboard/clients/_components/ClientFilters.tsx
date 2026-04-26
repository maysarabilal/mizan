'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export function ClientFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSearch = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('search', value)
    } else {
      params.delete('search')
    }
    params.delete('page')
    router.replace(`/dashboard/clients?${params.toString()}`)
  }, 300)

  return (
    <div className="bg-white border border-black/[0.08] rounded-xl p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9AA3B2]" />
          <Input
            type="search"
            placeholder="بحث بالاسم، الهاتف، رقم الهوية، البريد..."
            defaultValue={searchParams.get('search') || ''}
            onChange={(e) => handleSearch(e.target.value)}
            className="pr-10 h-10 bg-slate-50 border-black/8 text-[13px] placeholder:text-[#9AA3B2]"
          />
        </div>
      </div>
    </div>
  )
}
