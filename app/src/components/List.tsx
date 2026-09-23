import { ListGroup } from 'react-bootstrap';

type ListProps = {
  items?: string[];
};

const List = ({ items }: ListProps) => {
  if (!items || items.length === 0) {
    return <></>;
  }

  return (
    <ListGroup>
      {items.map((item: string, index: number) => (
        // eslint-disable-next-line @eslint-react/no-array-index-key -- plain strings with no stable id; list is static, never reordered
        <ListGroup.Item key={index} className="text-break no-select">
          {item}
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
};

export default List;
