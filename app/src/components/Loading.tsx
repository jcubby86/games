import Spinner from 'react-bootstrap/Spinner';

const Loading = () => {
  return (
    <div className="center-content min-vh-100 w-100">
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    </div>
  );
};

export default Loading;
