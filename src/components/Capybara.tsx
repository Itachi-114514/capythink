export function Capybara({ className }: { className?: string }) {
  return (
    <span className={`capy ${className ?? ''}`.trim()}>
      <img
        src="/capybara.jpg"
        alt=""
        className="capy-photo"
        width={640}
        height={640}
        draggable={false}
      />
    </span>
  );
}
