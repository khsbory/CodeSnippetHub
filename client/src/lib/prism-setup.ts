import Prism from 'prismjs';

// Core styles are included in prism-theme.css

// Languages
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';

// Plugins
import 'prismjs/plugins/line-numbers/prism-line-numbers';

// 손상된 Prism 객체가 있으면 안전하게 처리
if (typeof Prism !== 'undefined') {
  // Add languages that require a different class name
  if (Prism.languages && Prism.languages.markup) {
    Prism.languages.html = Prism.languages.markup;
  }

  // Initialize Prism (명시적으로 수동 모드 설정)
  Prism.manual = true;
}

export default Prism;
