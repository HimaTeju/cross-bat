export default function BrandMark({ className = "brand-mark" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
      <g transform="rotate(45 16 16)">
        <rect x="14.2" y="2" width="3.6" height="11" rx="1.8" className="bat-blade" />
        <rect x="12" y="11.5" width="8" height="15" rx="3.6" className="bat-blade" />
      </g>
      <g transform="rotate(-45 16 16)">
        <rect x="14.2" y="2" width="3.6" height="11" rx="1.8" className="bat-blade-alt" />
        <rect x="12" y="11.5" width="8" height="15" rx="3.6" className="bat-blade-alt" />
      </g>
      <circle cx="16" cy="9" r="3.1" className="bat-ball" />
      <path
        d="M14.3 9c0.7-0.9 2.1-1.5 3.4-0.8M14.3 9.6c0.9 0.9 2.3 1 3.4 0.2"
        className="bat-seam"
      />
    </svg>
  );
}
