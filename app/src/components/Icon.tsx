interface IconProps {
  icon: string;
  className?: string;
}

const Icon = ({ className, icon }: IconProps): JSX.Element => {
  return (
    <span className={'icon ' + (className ?? '')}>
      <i className={icon} />
    </span>
  );
};

export default Icon;
