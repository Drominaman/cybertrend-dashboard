import { ChartBarIcon } from './icons';

const Header = () => {
  return (
    <header className="py-6 sm:py-8">
      <div className="flex items-center justify-center space-x-4">
        <ChartBarIcon className="h-10 w-10 text-blue-400" />
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-100 tracking-tight text-center">
          Cybersecurity Trends Dashboard
        </h1>
      </div>
       <p className="text-center text-slate-400 mt-2 max-w-2xl mx-auto">
        Explore the latest trends by topic, technology, and company. All data is sourced live and publicly available.
      </p>
    </header>
  );
};

export default Header;