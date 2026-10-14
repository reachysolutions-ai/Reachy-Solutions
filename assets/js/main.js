(function initTheme() {
  const STORAGE_KEY = 'reachy-theme';

  function getPreferredTheme() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch (e) { /* ignore */ }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('.theme-toggle').forEach((toggle) => {
      toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    });
  }

  applyTheme(getPreferredTheme());

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.theme-toggle').forEach((toggle) => {
      toggle.addEventListener('click', () => {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem(STORAGE_KEY, next); } catch (e) { /* ignore */ }
        applyTheme(next);
      });
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      try {
        if (!localStorage.getItem(STORAGE_KEY)) applyTheme(e.matches ? 'dark' : 'light');
      } catch (err) { /* ignore */ }
    });
  });
})();

document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.header');
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');

  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progress);

  const backdrop = document.createElement('div');
  backdrop.className = 'nav-backdrop';
  document.body.appendChild(backdrop);

  let ticking = false;
  const onScroll = () => {
    if (header) header.classList.toggle('scrolled', window.scrollY > 24);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
  };

  onScroll();
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      onScroll();
      toggleBackToTop();
      ticking = false;
    });
  }, { passive: true });

  const setMenu = (open) => {
    if (!nav || !menuToggle) return;
    nav.classList.toggle('open', open);
    menuToggle.classList.toggle('active', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('menu-open', open);
    backdrop.classList.toggle('show', open);
  };

  backdrop.addEventListener('click', () => setMenu(false));
  window.addEventListener('resize', () => {
    if (window.innerWidth > 960) setMenu(false);
  });

  if (menuToggle && nav) {
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-controls', 'site-nav');
    menuToggle.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setMenu(false);
    });
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });

  document.querySelectorAll('.fade-in').forEach((el) => {
    const siblings = [...el.parentElement.children].filter((node) => node.classList.contains('fade-in'));
    const index = Math.max(0, siblings.indexOf(el));
    el.style.setProperty('--d', `${Math.min(index, 7) * 70}ms`);
  });

  document.querySelectorAll('.fade-in, .process-step').forEach((el) => observer.observe(el));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('.hero h1, .page-hero h1').forEach((heading) => {
    if (reduceMotion) return;
    let index = 0;
    const split = (node, highlighted) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(' '));
              return;
            }
            const word = document.createElement('span');
            word.className = 'char-word';
            [...part].forEach((letter) => {
              const span = document.createElement('span');
              span.className = highlighted ? 'char char-highlight' : 'char';
              span.style.setProperty('--i', index++);
              span.textContent = letter;
              word.appendChild(span);
            });
            frag.appendChild(word);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          split(child, highlighted || child.classList.contains('highlight'));
        }
      });
    };
    split(heading, false);
    heading.classList.add('chars-on');
  });

  const buddy = document.getElementById('buddy');
  const buddyBubble = document.getElementById('buddyBubble');
  const buddyLines = buddy?.closest('.hero-visual')
    ? ['Hi, I’m Reach.', 'Ideas, meet reality.', 'Let’s build it.', 'Tell me what you’re making.']
    : ['Tell me the idea.', 'A clear brief helps.', 'I’ll pass this to the team.', 'Every detail gets emailed.'];
  let buddyLine = 0;

  const say = (text) => {
    if (!buddy || !buddyBubble || buddyBubble.textContent === text) return;
    buddyBubble.textContent = text;
    buddy.classList.remove('is-talking');
    void buddy.offsetWidth;
    buddy.classList.add('is-talking');
  };

  if (buddy && !reduceMotion) {
    buddy.addEventListener('click', () => {
      buddyLine = (buddyLine + 1) % buddyLines.length;
      say(buddyLines[buddyLine]);
    });

    document.querySelectorAll('.btn-primary').forEach((button) => {
      button.addEventListener('pointerenter', () => {
        buddy.classList.add('is-waving');
        say('Ready when you are.');
      });
      button.addEventListener('pointerleave', () => buddy.classList.remove('is-waving'));
    });

    const pupils = buddy.querySelectorAll('.buddy-pupil');
    window.addEventListener('pointermove', (event) => {
      pupils.forEach((pupil) => {
        const rect = pupil.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        const angle = Math.atan2(dy, dx);
        const dist = Math.min(3.2, Math.hypot(dx, dy) / 90);
        pupil.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`;
      });
    }, { passive: true });
  }

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach((link) => {
    const href = link.getAttribute('href');
    if (href === currentPage) link.classList.add('active');
  });

  const params = new URLSearchParams(window.location.search);
  const serviceParam = params.get('service');
  if (serviceParam) {
    const select = document.getElementById('service');
    if (select) select.value = serviceParam;
  }

  const INBOX = 'Reachysolutions@gmail.com';
  const serviceCopy = {
    software: {
      hint: 'Tell us the workflow this software should replace.',
      placeholder: 'Who uses it, what they do today, and what a first version must include.'
    },
    website: {
      hint: 'Tell us the pages and the action you want visitors to take.',
      placeholder: 'What should the site explain, and how should someone get in touch or buy?'
    },
    ecommerce: {
      hint: 'Tell us what you sell and how orders are handled now.',
      placeholder: 'Catalog size, payments, shipping, and what feels broken in the current store.'
    },
    uiux: {
      hint: 'Tell us which product or site needs a clearer experience.',
      placeholder: 'Where do people get stuck, and do you need flows, a redesign, or a design system?'
    },
    ai: {
      hint: 'Tell us the job the AI should take off your team’s plate.',
      placeholder: 'What questions, documents, or tasks should it handle, and where does that data live?'
    },
    other: {
      hint: 'Not sure yet — describe the outcome you want.',
      placeholder: 'What would be different for the business if this project went well?'
    }
  };
  const fieldPrompts = {
    firstName: 'What should I call you?',
    lastName: 'And the rest of the name?',
    email: 'Where should the reply go?',
    phone: 'A number helps if we need a quick call.',
    company: 'Which team is this for?',
    service: 'Pick the closest starting point.',
    budget: 'A range keeps the proposal realistic.',
    timeline: 'When do you want to begin?',
    message: 'This is the part the team reads first.'
  };

  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    const requiredIds = ['firstName', 'lastName', 'email', 'service', 'message'];
    const progressBar = document.getElementById('formProgressBar');
    const progressLabel = document.getElementById('formProgressLabel');
    const service = document.getElementById('service');
    const message = document.getElementById('message');
    const hint = document.getElementById('serviceHint');
    const timelineGroup = document.getElementById('timelineGroup');
    const messageCount = document.getElementById('messageCount');
    const resend = document.getElementById('resendMail');

    const optionLabel = (select) => {
      if (!select || !select.value) return 'Not specified';
      return select.options[select.selectedIndex]?.text || select.value;
    };

    const fieldError = (id, text) => {
      const group = document.getElementById(id)?.closest('.form-group');
      const slot = contactForm.querySelector(`[data-for="${id}"]`);
      if (!group || !slot) return;
      group.classList.toggle('is-invalid', Boolean(text));
      group.classList.toggle('is-valid', !text && Boolean(document.getElementById(id).value.trim()));
      slot.textContent = text || '';
    };

    const checkField = (id) => {
      const input = document.getElementById(id);
      if (!input) return true;
      const value = input.value.trim();
      if (input.required && !value) {
        fieldError(id, 'This detail is required.');
        return false;
      }
      if (id === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        fieldError(id, 'Enter a valid email address.');
        return false;
      }
      if (input.minLength > 0 && value && value.length < input.minLength) {
        fieldError(id, `Add a little more — at least ${input.minLength} characters.`);
        return false;
      }
      fieldError(id, '');
      return true;
    };

    const updateProgress = () => {
      const done = requiredIds.filter((id) => {
        const input = document.getElementById(id);
        return input && input.value.trim() && (id !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim()));
      }).length;
      if (progressBar) progressBar.style.width = `${(done / requiredIds.length) * 100}%`;
      if (progressLabel) progressLabel.textContent = `${done} of ${requiredIds.length} required`;
    };

    const updateMessageCount = () => {
      if (!message || !messageCount) return;
      messageCount.textContent = `${message.value.trim().length} characters`;
    };

    service?.addEventListener('change', () => {
      const copy = serviceCopy[service.value];
      if (copy) {
        if (hint) hint.textContent = copy.hint;
        if (message && !message.value) message.placeholder = copy.placeholder;
      }
      if (timelineGroup) {
        timelineGroup.hidden = false;
        timelineGroup.classList.add('form-reveal');
      }
      say(copy?.hint || 'Got it.');
      checkField('service');
      updateProgress();
    });

    contactForm.querySelectorAll('input, select, textarea').forEach((input) => {
      input.addEventListener('focus', () => {
        if (fieldPrompts[input.id]) say(fieldPrompts[input.id]);
      });
      input.addEventListener('blur', () => {
        if (requiredIds.includes(input.id)) checkField(input.id);
      });
      input.addEventListener('input', () => {
        if (input.id === 'message') updateMessageCount();
        if (requiredIds.includes(input.id) && input.closest('.form-group')?.classList.contains('is-invalid')) {
          checkField(input.id);
        }
        updateProgress();
      });
    });

    const presetMessage = params.get('message');
    if (presetMessage && message && !message.value) message.value = presetMessage.slice(0, 2000);

    updateMessageCount();
    updateProgress();
    if (service?.value) service.dispatchEvent(new Event('change'));

    contactForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const ok = requiredIds.every((id) => checkField(id));
      if (!ok) {
        contactForm.querySelector('.is-invalid input, .is-invalid select, .is-invalid textarea')?.focus();
        say('A few required details are still open.');
        return;
      }

      const data = Object.fromEntries(new FormData(contactForm).entries());
      const lines = [
        'New project inquiry from the Reachy Solutions website',
        '',
        `Name: ${data.firstName} ${data.lastName}`,
        `Email: ${data.email}`,
        `Phone: ${data.phone || 'Not specified'}`,
        `Company: ${data.company || 'Not specified'}`,
        `Service: ${optionLabel(service)}`,
        `Budget: ${data.budget || 'Not specified'}`,
        `Start: ${data.timeline || 'Not specified'}`,
        '',
        'Project details:',
        data.message
      ];
      const subject = encodeURIComponent(`Project inquiry — ${optionLabel(service)}`);
      const body = encodeURIComponent(lines.join('\n'));
      const href = `mailto:${INBOX}?subject=${subject}&body=${body}`;
      if (resend) resend.href = href;
      window.location.href = href;
      contactForm.classList.add('is-sent');
      say('Opening your email with the full brief.');
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      document.querySelectorAll('.filter-btn').forEach((b) => {
        b.classList.toggle('is-active', b === btn);
        b.setAttribute('aria-pressed', String(b === btn));
      });
      document.querySelectorAll('.portfolio-card').forEach((card) => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('is-hidden', !match);
        if (!match) return;
        card.classList.remove('visible');
        void card.offsetWidth;
        card.classList.add('visible');
      });
    });
  });

  document.querySelectorAll('.faq-item button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const open = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach((el) => {
        el.classList.remove('open');
        el.querySelector('button')?.setAttribute('aria-expanded', 'false');
        const mark = el.querySelector('button span');
        if (mark) mark.textContent = '+';
      });
      if (!open) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        const mark = btn.querySelector('span');
        if (mark) mark.textContent = '−';
      }
    });
  });

  const backBtn = document.createElement('button');
  backBtn.className = 'back-to-top';
  backBtn.type = 'button';
  backBtn.setAttribute('aria-label', 'Back to top');
  backBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  backBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  document.body.appendChild(backBtn);

  function toggleBackToTop() {
    backBtn.classList.toggle('visible', window.scrollY > 600);
  }
  toggleBackToTop();

  const chatTopics = [
    { id: 'greeting', keys: ['hi', 'hello', 'hey', 'good morning', 'good evening'], related: ['Services', 'How long?', 'Contact'], answer: 'Hi, I’m Reach. Ask me about services, timelines, pricing, who we work with, or how to start a project.' },
    { id: 'services', keys: ['service', 'what do you do', 'what can you', 'offer', 'help with', 'capabilities', 'what do you build'], related: ['Custom software', 'Websites', 'E-commerce', 'AI tools'], answer: 'Reachy Solutions builds five kinds of work: <a href="services.html#software">custom software</a>, <a href="services.html#websites">websites</a>, <a href="services.html#ecommerce">e-commerce</a>, <a href="services.html#uiux">UI/UX</a>, and <a href="services.html#ai">custom AI tools</a>.' },
    { id: 'software', keys: ['software', 'web app', 'dashboard', 'crm', 'internal tool', 'platform', 'api', 'integration', 'modernization'], related: ['How long?', 'Pricing', 'Start software'], answer: 'Custom software is shaped around the workflow you already have. That includes business management tools, web apps, internal dashboards, CRMs, workflow automation, APIs, and modernizing older systems. It suits startups, smaller companies, and teams with operations a template can’t cover. <a href="contact.html?service=software">Discuss a software project</a>.' },
    { id: 'website', keys: ['website', 'web site', 'landing page', 'seo', 'corporate site', 'cms', 'blog'], related: ['How long?', 'SEO', 'Start a website'], answer: 'Websites include corporate sites, service sites, landing pages, portfolios, redesigns, and CMS-backed sites. The focus is speed, responsiveness, accessibility, SEO structure, and easy maintenance. A focused site is often 2–4 weeks. <a href="contact.html?service=website">Start a website brief</a>.' },
    { id: 'ecommerce', keys: ['ecommerce', 'e-commerce', 'online store', 'shop', 'checkout', 'stripe', 'catalog', 'inventory', 'shipping', 'payment'], related: ['Store timeline', 'Pricing', 'Plan a store'], answer: 'E-commerce covers the storefront, product catalog, cart, checkout, payments, inventory, customer accounts, admin, and shipping integrations. It is aimed at retailers, direct-to-consumer brands, wholesalers, and product businesses. <a href="contact.html?service=ecommerce">Plan a store</a>.' },
    { id: 'design', keys: ['ui', 'ux', 'design', 'figma', 'prototype', 'wireframe', 'design system', 'mobile interface'], related: ['Websites', 'Custom software', 'Talk design'], answer: 'UI/UX covers website and product interfaces, mobile app screens, user flows, wireframes, prototypes, and design systems. The sequence is: understand the user, structure the experience, design the interface, then test and refine. <a href="contact.html?service=uiux">Talk about design</a>.' },
    { id: 'ai', keys: ['ai', 'artificial intelligence', 'chatbot', 'openai', 'knowledge base', 'document', 'machine learning', 'copilot'], related: ['What can you build', 'Start AI', 'Contact'], answer: 'Custom AI is built for a real job: business assistants, chatbots, document analysis, knowledge bases, intelligent search, and workflow automation. Examples include a knowledge assistant, a support copilot, and document intelligence. This on-site chat answers questions about Reachy. A product assistant is its own project. <a href="contact.html?service=ai">Ask about an AI tool</a>.' },
    { id: 'automation', keys: ['automation', 'workflow', 'handoff', 'zapier'], related: ['Custom software', 'AI tools', 'Start software'], answer: 'Workflow automation connects the systems a team already uses so manual handoffs stop slowing the work. It can sit inside custom software or an AI workflow. <a href="portfolio.html">See the automation example</a>.' },
    { id: 'pricing', keys: ['price', 'pricing', 'cost', 'budget', 'quote', 'how much', 'fee', 'rate'], related: ['How long?', 'Start a project', 'Budgets'], answer: 'There is no public rate card. The contact form uses these ranges: under $5,000, $5,000–$15,000, $15,000–$50,000, $50,000+, or “let’s discuss.” You get a tailored proposal after the first conversation. <a href="contact.html">Start a project</a>.' },
    { id: 'timeline', keys: ['how long', 'timeline', 'duration', 'weeks', 'months', 'deadline', 'how soon', 'turnaround'], related: ['Pricing', 'Process', 'Start a project'], answer: 'A focused website is often 2–4 weeks. Custom software typically runs 2–6 months. The exact timeline comes after the first conversation, once scope and constraints are clear.' },
    { id: 'process', keys: ['process', 'how do you work', 'steps', 'discover', 'methodology'], related: ['What happens next', 'How long?', 'Start a project'], answer: 'The build path is Discover, Plan, Design, Build, Refine, and Launch. Discover covers goals and constraints. Plan sets scope, stack, and timeline. Design covers flows and brand fit. Build makes it stable. Refine tests and hardens it. Launch includes support and the next improvements.' },
    { id: 'next', keys: ['what happens next', 'after i submit', 'reply', 'response time', 'business day', 'proposal'], related: ['Contact', 'Process', 'Start a project'], answer: 'Send the form or an email. The team reviews the brief, asks a few questions, and sends a tailored proposal. Replies go out within one business day.' },
    { id: 'startup', keys: ['startup', 'mvp', 'founder', 'early stage'], related: ['Pricing', 'How long?', 'Start software'], answer: 'Yes. Reachy helps founders go from an idea to an MVP, with a scope that can match an early-stage budget. <a href="contact.html?service=software&message=We%20are%20a%20startup%20looking%20for%20an%20MVP.">Tell us about the MVP</a>.' },
    { id: 'existing', keys: ['existing', 'take over', 'takeover', 'legacy', 'rebuild', 'audit', 'codebase'], related: ['Redesign', 'Process', 'Contact'], answer: 'Yes. An existing product can be audited first. The team identifies risk, then recommends a safe path to improve or rebuild. <a href="contact.html?message=We%20have%20an%20existing%20product%20we%20want%20reviewed.">Send the current product</a>.' },
    { id: 'redesign', keys: ['redesign', 'refresh', 'outdated site'], related: ['Websites', 'UI UX', 'Start a website'], answer: 'Redesigns cover performance, structure, and a closer match to the brand. A corporate redesign in the portfolio included service pages, case studies, a contact flow, and SEO-ready structure. <a href="contact.html?service=website&message=We%20need%20a%20website%20redesign.">Start a redesign brief</a>.' },
    { id: 'stack', keys: ['tech', 'stack', 'react', 'next', 'node', 'python', 'postgres', 'postgresql', 'technology', 'tailwind', 'fastapi', 'mongodb'], related: ['Custom software', 'AI tools', 'Websites'], answer: 'The usual stack is React, Next.js, Node.js, Python, and PostgreSQL, with Figma for design. Portfolio work has also used Stripe, Tailwind, FastAPI, MongoDB, and OpenAI. The stack is chosen for the problem.' },
    { id: 'contact', keys: ['email', 'contact', 'phone', 'gmail', 'reach you', 'get in touch', 'address', 'office', 'location', 'where are you'], related: ['Start a project', 'What happens next', 'Consultation'], answer: 'Email <a href="mailto:Reachysolutions@gmail.com">Reachysolutions@gmail.com</a> or use the <a href="contact.html">project form</a>. There isn’t a public office address or phone number on the site. The studio works with clients remotely, and replies go out within one business day.' },
    { id: 'about', keys: ['who are', 'about', 'what is reachy', 'company', 'slogan', 'logo', 'brand'], related: ['Services', 'Values', 'Portfolio'], answer: 'Reachy Solutions is a technology studio. The slogan is “Where Ideas Reach Reality.” The mark is an R with an upward arrow: progress from idea to outcome. The work spans software, websites, commerce, UI/UX, and practical AI. <a href="about.html">Read the story</a>.' },
    { id: 'values', keys: ['value', 'mission', 'vision', 'purpose', 'integrity', 'quality'], related: ['About', 'Why Reachy', 'Process'], answer: 'The mission is to turn ideas into practical digital solutions. The vision is to be known for quality, clarity, and products that last. Values are innovation, integrity, simplicity, quality, collaboration, and growth.' },
    { id: 'why', keys: ['why reachy', 'why you', 'different', 'idea first', 'tailored'], related: ['Process', 'Services', 'Start a project'], answer: 'Reachy starts with the problem before the stack. Builds are tailored to the workflow, design and engineering stay in the same conversation, and the next version is planned from day one. You can see where the project stands as it moves.' },
    { id: 'clients', keys: ['who do you work', 'client', 'enterprise', 'smb', 'small business', 'professional', 'organization', 'retailer'], related: ['Startups', 'E-commerce', 'Custom software'], answer: 'Clients include startups, growing businesses, e-commerce brands, enterprises, independent professionals, and organizations. The same standard applies: it has to look considered and work in the real world.' },
    { id: 'portfolio', keys: ['portfolio', 'case', 'example', 'past work', 'selected work'], related: ['Software example', 'Store example', 'AI example'], answer: 'Selected work includes a business management platform, a modern e-commerce store, a corporate website redesign, an AI knowledge assistant, a SaaS dashboard UI, and workflow automation. <a href="portfolio.html">See the portfolio</a>.' },
    { id: 'support', keys: ['support', 'maintenance', 'after launch', 'retain', 'hosting'], related: ['Process', 'What happens next', 'Contact'], answer: 'Launch includes shipping the product and room to keep improving it. Ongoing maintenance is planned with the proposal rather than assumed. Hosting choices are confirmed for the specific project.' },
    { id: 'seo', keys: ['seo', 'accessibility', 'a11y', 'google', 'search'], related: ['Websites', 'Start a website', 'How long?'], answer: 'Website work includes SEO-ready structure, responsive layout, and accessibility. That means the page structure, speed, and content hierarchy are built so people and search engines can use the site.' },
    { id: 'consult', keys: ['consultation', 'call', 'meeting', 'discovery call'], related: ['Contact', 'What happens next', 'Start a project'], answer: 'A consultation is a short call to clarify goals, constraints, and a realistic path. You can request it from the <a href="contact.html">contact page</a>.' },
    { id: 'legal', keys: ['nda', 'confidential', 'contract', 'own the code', 'ownership', 'ip'], related: ['Contact', 'Start a project', 'What happens next'], answer: 'Confidentiality, contracts, and who owns the code are confirmed in the proposal and agreement. They are not spelled out as a blanket policy on the site. Mention any requirement in the brief.' },
    { id: 'mobile', keys: ['mobile', 'ios', 'android', 'responsive', 'phone'], related: ['UI UX', 'Websites', 'Custom software'], answer: 'Sites and web apps are built responsive, so they work on phones. Mobile app interfaces are part of UI/UX. A native iOS or Android app would be scoped separately if that is what you need.' },
    { id: 'careers', keys: ['job', 'career', 'hiring', 'internship', 'work with you'], related: ['Contact', 'About', 'Services'], answer: 'There is no public jobs page. Send a note to <a href="mailto:Reachysolutions@gmail.com">Reachysolutions@gmail.com</a> and the team can tell you if they are looking.' },
    { id: 'language', keys: ['language', 'english', 'hindi'], related: ['Contact', 'Websites', 'Start a project'], answer: 'The site and proposals are in English. If a product needs another language, say so in the brief and it can be scoped.' },
    { id: 'self', keys: ['are you ai', 'are you a bot', 'who is reach', 'this chat', 'chatbot'], related: ['AI tools', 'Services', 'Contact'], answer: 'I’m Reach, the on-site assistant. I answer from Reachy’s services, process, portfolio, and contact details. I don’t replace a custom AI product. For a knowledge assistant of your own, look at <a href="services.html#ai">custom AI tools</a>.' }
  ];

  const quickMap = {
    'start software': 'I want custom software',
    'start a website': 'I need a website',
    'plan a store': 'I want an online store',
    'talk design': 'I need UI UX design',
    'start ai': 'I want a custom AI tool',
    'start a project': 'How do I start a project',
    'software example': 'Tell me about the business platform',
    'store example': 'Tell me about the e-commerce project',
    'ai example': 'Tell me about the AI assistant project',
    'store timeline': 'How long does an online store take',
    'budgets': 'What budgets do you work with',
    'ui ux': 'What does UI UX include',
    'what can you build': 'What AI tools can you build'
  };

  const replyTo = (raw) => {
    const text = raw.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
    const fallbackRelated = ['Services', 'How long?', 'Contact'];
    if (!text) return { html: 'Type a question about services, timing, pricing, or starting a project.', related: fallbackRelated };
    if (/^(hi|hello|hey|good morning|good evening)$/.test(text)) {
      return { html: chatTopics[0].answer, related: chatTopics[0].related };
    }
    const words = text.split(' ');
    const matches = (key) => {
      if (key.includes(' ')) return text.includes(key);
      return words.some((word) => word === key || (key.length > 3 && word.startsWith(key)));
    };
    const ranked = chatTopics
      .map((topic) => ({
        topic,
        score: topic.keys.reduce((total, key) => total + (matches(key) ? key.length : 0), 0)
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);
    if (!ranked.length) {
      const encoded = encodeURIComponent(raw.slice(0, 500));
      return {
        html: `I don’t have a firm answer for that yet. Email <a href="mailto:Reachysolutions@gmail.com">Reachysolutions@gmail.com</a> or <a href="contact.html?message=${encoded}">put the question in a project brief</a>.`,
        related: fallbackRelated
      };
    }
    const best = ranked[0].topic;
    const second = ranked[1];
    let html = best.answer;
    if (second && second.score >= Math.max(6, ranked[0].score * 0.72) && second.topic.id !== best.id) {
      html += `<p>${second.topic.answer}</p>`;
    }
    return { html, related: best.related };
  };

  const launcher = document.createElement('button');
  launcher.className = 'chat-launcher';
  launcher.type = 'button';
  launcher.setAttribute('aria-expanded', 'false');
  launcher.setAttribute('aria-controls', 'reach-chat');
  launcher.innerHTML = '<span class="chat-launcher-face" aria-hidden="true"><span></span></span><span class="chat-launcher-label">Ask Reach</span>';

  const panel = document.createElement('section');
  panel.className = 'chat-panel';
  panel.id = 'reach-chat';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Ask Reach');
  panel.innerHTML = `
    <div class="chat-head">
      <span class="chat-status" aria-hidden="true"></span>
      <div>
        <h2>Reach</h2>
        <p>Answers questions about Reachy Solutions</p>
      </div>
      <button class="chat-close" type="button" aria-label="Close chat">×</button>
    </div>
    <div class="chat-log" id="reach-chat-log"></div>
    <div class="chat-quick" id="reach-chat-quick">
      <button type="button">Services</button>
      <button type="button">How long?</button>
      <button type="button">Pricing</button>
      <button type="button">Contact</button>
    </div>
    <form class="chat-form" id="reach-chat-form">
      <input id="reach-chat-input" type="text" name="question" maxlength="400" placeholder="Ask about a service or timeline" autocomplete="off">
      <button type="submit">Send</button>
    </form>`;

  document.body.append(launcher, panel);

  const log = panel.querySelector('#reach-chat-log');
  const form = panel.querySelector('#reach-chat-form');
  const input = panel.querySelector('#reach-chat-input');
  const quick = panel.querySelector('#reach-chat-quick');
  const STORAGE_KEY = 'reachy-chat';
  let history = [];

  const addMessage = (role, html, persist) => {
    const item = document.createElement('div');
    item.className = `chat-msg chat-msg--${role}`;
    const paragraph = document.createElement('p');
    if (role === 'user') paragraph.textContent = html;
    else paragraph.innerHTML = html;
    item.appendChild(paragraph);
    log.appendChild(item);
    log.scrollTop = log.scrollHeight;
    if (persist) {
      history.push({ role, html });
      if (history.length > 30) history = history.slice(-30);
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history)); } catch (error) { /* ignore */ }
    }
  };

  const showTyping = () => {
    const node = document.createElement('div');
    node.className = 'chat-typing';
    node.innerHTML = '<i></i><i></i><i></i>';
    log.appendChild(node);
    log.scrollTop = log.scrollHeight;
    return node;
  };

  const setQuick = (labels) => {
    quick.innerHTML = '';
    labels.forEach((label) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      quick.appendChild(button);
    });
    quick.hidden = false;
  };

  const respond = (question) => {
    addMessage('user', question, true);
    const typing = showTyping();
    window.setTimeout(() => {
      typing.remove();
      const result = replyTo(question);
      addMessage('bot', result.html, true);
      setQuick(result.related);
    }, reduceMotion ? 0 : 550);
  };

  const askFromChip = (label) => {
    const mapped = quickMap[label.toLowerCase()];
    respond(mapped || label);
  };

  const setOpen = (open) => {
    panel.hidden = !open;
    launcher.setAttribute('aria-expanded', String(open));
    launcher.hidden = open;
    if (open) input.focus();
  };

  try {
    history = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(history)) history = [];
  } catch (error) {
    history = [];
  }

  if (!history.length) {
    addMessage('bot', 'Hi, I’m Reach. I can help with services, timelines, pricing, and how to contact the team.', false);
  } else {
    history.forEach((entry) => addMessage(entry.role, entry.html, false));
    quick.hidden = true;
  }

  launcher.addEventListener('click', () => setOpen(true));
  panel.querySelector('.chat-close').addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) setOpen(false);
  });
  quick.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    askFromChip(button.textContent);
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question) return;
    input.value = '';
    respond(question);
  });
});
