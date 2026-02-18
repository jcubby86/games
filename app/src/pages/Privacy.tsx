const Privacy = () => {
  return (
    <div className="privacy-policy">
      <h2 className="mb-3">Privacy Policy</h2>

      <div className="mb-3">
        <h5>Data Storage</h5>
        <p>
          We store game session data (game ID, player ID, nickname) in your
          browser&apos;s local storage to maintain your connection when you
          refresh the page. This data is essential for the game to function and
          is not shared with third parties.
        </p>
      </div>

      <div className="mb-3">
        <h5>Data Collection</h5>
        <p>
          We only collect information necessary to run the game. No personal
          information is stored on our servers beyond your chosen nickname for
          the duration of your game session.
        </p>
      </div>

      <div className="mb-3">
        <h5>Third Party Services</h5>
        <p>
          This application does not use cookies, analytics, or third-party
          tracking services.
        </p>
      </div>

      <div className="mb-3">
        <h5>Contact</h5>
        <p>
          For privacy questions or concerns, please contact:{' '}
          <a href="mailto:games@muffinjr.com">games@muffinjr.com</a>
        </p>
      </div>

      <p className="text-muted small">Last updated: January 30, 2026</p>
    </div>
  );
};

export default Privacy;
