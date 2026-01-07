const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 text-sm">
            © 2024 Zeta Exams. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-600 hover:text-primary-600 text-sm">Privacy Policy</a>
            <a href="#" className="text-gray-600 hover:text-primary-600 text-sm">Terms of Service</a>
            <a href="#" className="text-gray-600 hover:text-primary-600 text-sm">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;