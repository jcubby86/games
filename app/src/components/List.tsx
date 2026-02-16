import { ListGroup } from 'react-bootstrap';

type ListProps = {
  items?: string[];
  className?: string;
};

const List = ({ items, className }: ListProps) => {
  if (!items || items.length === 0) {
    return <></>;
  }

  return (
    <ListGroup className={`mt-3 ${className}`}>
      {items.map((item: string, index: number) => (
        <ListGroup.Item key={index} className="text-break no-select">
          {item}
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
};

export default List;
