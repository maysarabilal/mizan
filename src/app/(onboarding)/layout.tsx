export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gray-50/50 p-4 md:p-8 dark:bg-zinc-950">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
