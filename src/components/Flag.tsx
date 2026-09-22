export function Flag({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`pr-flag ${className}`}
      viewBox="0 0 75 50"
      role="img"
      aria-label="Puerto Rican flag"
    >
      <path fill="#fff" d="M0 0h75v50H0z" />
      <path fill="#ed174c" d="M0 0h75v10H0zm0 20h75v10H0zm0 20h75v10H0z" />
      <path fill="#005bbb" d="M0 0l43.3 25L0 50z" />
      <path
        fill="#fff"
        d="m16 15 2.4 7.3h7.7l-6.2 4.5 2.4 7.3-6.3-4.5-6.2 4.5 2.4-7.3L6 22.3h7.7z"
      />
    </svg>
  );
}
