const Spinner = ({ hide }: { hide?: boolean }) => {
  if (hide) {
    return <></>;
  }
  return (
    <span
      className="spinner-border spinner-border-sm mx-1"
      role="status"
      aria-hidden="true"
    ></span>
  );
};

export default Spinner;
