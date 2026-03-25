// Brain Food Recovery Services — Logo component
// Uses the horizontal SVG logos from /public/images/logo/
// dark=true → black logo (for light/scrolled navbar)
// dark=false → white logo (for transparent/dark navbar, default)
const LogoFull = ({ className = "", dark = false }) => {
  return (
    <img
      src={
        dark
          ? "/images/logo/BRAINFOOD HORIZONTAL LOGO BLACK.svg"
          : "/images/logo/BRAINFOOD HORIZONTAL LOGO WHITE.svg"
      }
      alt="Brain Food Recovery Services"
      className={className}
    />
  );
};

export default LogoFull;
