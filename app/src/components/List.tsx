const List = ({ items }: { items?: string[] }): JSX.Element => {
  if (!items || items.length === 0) {
    return <></>;
  }

  return (
    <ul className="list-group mt-3">
      {items.map((item: string, index: number) => (
        <li key={index} className="list-group-item text-break">
          {item}
        </li>
      ))}
    </ul>
  );
};

export default List;
