import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-hex-dark border-t border-hex-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-hex-gradient rounded-lg flex items-center justify-center">
                <span className="font-orbitron text-sm font-bold text-white">H</span>
              </div>
              <div>
                <h3 className="font-orbitron text-sm font-bold text-gradient-purple">海克斯大乱斗战术探讨</h3>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap justify-center">
              <Link
                to="/privacy"
                className="text-gray-500 hover:text-hex-cyan transition-colors text-xs"
              >
                隐私政策
              </Link>
              <Link
                to="/agreement"
                className="text-gray-500 hover:text-hex-cyan transition-colors text-xs"
              >
                用户协议
              </Link>
              <Link
                to="/report"
                className="text-red-400 hover:text-red-300 transition-colors text-xs font-medium"
              >
                不良信息举报
              </Link>
              <Link
                to="/info-security"
                className="text-gray-500 hover:text-hex-cyan transition-colors text-xs"
              >
                信息安全管理制度
              </Link>
              <a
                href="#"
                className="text-gray-500 hover:text-hex-purple transition-colors"
                aria-label="微信公众号"
              >
                <MessageCircle size={18} />
              </a>
            </div>
          </div>

          <div className="w-full border-t border-hex-border/50 pt-4 flex flex-col items-center gap-2">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs text-gray-500">
              <span>© {new Date().getFullYear()} 海克斯大乱斗战术探讨</span>
              <span className="hidden sm:inline text-gray-700">|</span>
              <span>仅供娱乐用途</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs">
              <a
                href="https://beian.miit.gov.cn/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-400 transition-colors"
              >
                浙ICP备2026038688号
              </a>
              <span className="hidden sm:inline text-gray-700">|</span>
              <a
                href="http://www.beian.gov.cn/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-400 transition-colors inline-flex items-center gap-1"
              >
                <img
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%239ca3af'%3E%3Cpath d='M10 2a8 8 0 100 16 8 8 0 000-16zm0 14.4A6.4 6.4 0 1116.4 10 6.41 6.41 0 0110 16.4zm3.2-7.2H6.8a.8.8 0 000 1.6h6.4a.8.8 0 000-1.6z'/%3E%3C/svg%3E"
                  alt=""
                  className="w-3 h-3"
                />
                浙公网安备XXXXXXXXXXXXX号
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
