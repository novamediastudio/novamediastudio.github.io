document.addEventListener('DOMContentLoaded', function () {
fetch('content/about.md')
    .then(response => response.text())
    .then(markdown => {
        document.getElementById('about-content').innerHTML = marked.parse(markdown);

    })
    .catch(error => {
        console.error('Error loading Markdown file:', error);
        document.getElementById('about-content').textContent = 'Failed to load content.';
    });
fetch('content/press.md')
    .then(response => response.text())
    .then(markdown => {
        const lines = markdown.split('\n');
        let html = '';
        let inList = false;

        // Regex to match dates at the start of the line
        const datePart = '\\d{4}(?:[./-]\\d{1,2})?(?:[./-]\\d{1,2})?';
        const singleRegex = new RegExp(`^\\s*(${datePart})`);

        lines.forEach(line => {
            line = line.trim();
            if (!line) return;

            // Check for headers (bold text like **Header**)
            if (line.startsWith('**') && line.endsWith('**')) {
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                const headerText = line.replace(/\*\*/g, '');
                html += `<h3>${headerText}</h3>`;
            } else {
                if (!inList) {
                    html += '<ul>';
                    inList = true;
                }

                let dateStr = '';
                let content = line;
                const match = line.match(singleRegex);
                if (match) {
                    dateStr = match[1];
                    // Remove date and separators to get the content
                    content = line.replace(singleRegex, '').replace(/^[\*\-]\s+/, '').replace(/^[,.\-\|]\s+/, '').trim();
                } else {
                    // Clean up bullet points if no date found
                    content = line.replace(/^[\*\-]\s+/, '').trim();
                }

                html += `<li>
                    <span class="date">${dateStr}</span>
                    <span class="event">${marked.parseInline ? marked.parseInline(content) : content}</span>
                </li>`;
            }
        });

        if (inList) html += '</ul>';
        document.getElementById('press').innerHTML = html;

        // Add hover preview functionality for press links
        const pressLinks = document.querySelectorAll('#press a');

        if (pressLinks.length > 0) {
            // Create popup container
            let popup = document.getElementById('preview-popup');
            if (!popup) {
                popup = document.createElement('div');
                popup.id = 'preview-popup';
                const img = document.createElement('img');
                popup.appendChild(img);
                document.body.appendChild(popup);
            }
            const img = popup.querySelector('img');

            pressLinks.forEach(link => {
                link.addEventListener('mouseenter', () => {
                    img.src = `https://api.microlink.io/?url=${encodeURIComponent(link.href)}&screenshot=true&meta=false&embed=screenshot.url`;
                    popup.style.display = 'block';
                });
                link.addEventListener('mouseleave', () => {
                    popup.style.display = 'none';
                    img.src = '';
                });
            });
        }
    })
    .catch(error => {
        console.error('Error loading Markdown file:', error);
        document.getElementById('press').textContent = 'Failed to load content.';
    });
fetch('content/calendar.md')
    .then(response => response.text())
    .then(markdown => {
        const lines = markdown.split('\n');
        const sections = [];
        let currentSection = { title: '', events: [] };

        // Helper to parse date string (YYYY, YYYY.MM, YYYY.MM.DD)
        const parseDate = (str) => {
            const parts = str.split(/[./-]/);
            const y = parseInt(parts[0], 10);
            const m = parts[1] ? parseInt(parts[1], 10) - 1 : 0;
            const d = parts[2] ? parseInt(parts[2], 10) : 1;
            return new Date(y, m, d);
        };

        // Helper to determine end of period for comparison
        const getEndOfPeriod = (str) => {
            const parts = str.split(/[./-]/);
            const y = parseInt(parts[0], 10);
            const m = parts[1] ? parseInt(parts[1], 10) - 1 : 0;
            const d = parts[2] ? parseInt(parts[2], 10) : 1;
            const date = new Date(y, m, d);

            if (parts.length === 1) date.setFullYear(date.getFullYear() + 1);
            else if (parts.length === 2) date.setMonth(date.getMonth() + 1);
            else date.setDate(date.getDate() + 1);

            return date;
        };

        // Regex components
        const datePart = '\\d{4}(?:[./-]\\d{1,2})?(?:[./-]\\d{1,2})?';
        const rangeRegex = new RegExp(`^\\s*(${datePart})\\s*[\\-•]\\s*(${datePart})`);
        const singleRegex = new RegExp(`^\\s*(${datePart})`);

        lines.forEach(line => {
            if (!line.trim()) return;

            let dateObj = null;
            let effectiveEnd = null;
            let dateStr = '';
            let content = line;

            const rangeMatch = line.match(rangeRegex);
            const singleMatch = line.match(singleRegex);

            if (rangeMatch) {
                dateStr = rangeMatch[0].trim();
                dateObj = parseDate(rangeMatch[1]);
                effectiveEnd = getEndOfPeriod(rangeMatch[2]);
                content = content.replace(rangeMatch[0], '');
            } else {
                if (singleMatch) {
                    dateStr = singleMatch[0].trim();
                    dateObj = parseDate(singleMatch[1]);
                    effectiveEnd = getEndOfPeriod(singleMatch[1]);
                    content = content.replace(singleMatch[0], '');
                }
            }

            if (dateObj) {
                // Clean content
                content = content.replace(/^[\*\-]\s+/, '').trim(); // bullets
                content = content.replace(/^[,.\-\|]\s+/, '').trim(); // separators

                currentSection.events.push({
                    date: dateObj,
                    effectiveEnd: effectiveEnd,
                    dateStr: dateStr,
                    markdown: content
                });
            } else {
                // It's a header
                if (currentSection.title || currentSection.events.length > 0) {
                    sections.push(currentSection);
                }
                const title = line.trim().replace(/^\*\*|\*\*$/g, '');
                currentSection = { title: title, events: [] };
            }
        });

        if (currentSection.title || currentSection.events.length > 0) {
            sections.push(currentSection);
        }

        const now = new Date();

        const renderList = (list) => {
            return `<ul>` + list.map(e => `
                        <li>
                            <span class="date">${e.dateStr}</span>
                            <span class="event">${marked.parseInline ? marked.parseInline(e.markdown) : e.markdown}</span>
                        </li>`).join('') + `</ul>`;
        };

        let html = '';
        
        sections.forEach(section => {
            const upcoming = section.events.filter(e => e.effectiveEnd > now).sort((a, b) => a.date - b.date);
            const past = section.events.filter(e => e.effectiveEnd <= now).sort((a, b) => b.date - a.date);

            if (upcoming.length === 0 && past.length === 0) return;

            if (section.title) {
                html += `<h3>${section.title}</h3>`;
            }

            if (upcoming.length > 0) {
                html += `<h4>Upcoming</h4>${renderList(upcoming)}`;
            }
            if (past.length > 0) {
                html += `<h4>Past</h4>${renderList(past)}`;
            }
        });

        // Fallback if no dates were found, just render the markdown as is
        if (html === '') html = marked.parse(markdown);

        document.getElementById('calendar').innerHTML = html;
    })
    .catch(error => {
        console.error('Error loading Markdown file:', error);
        document.getElementById('calendar').textContent = 'Failed to load content.';
    });
});