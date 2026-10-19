import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from datetime import datetime
import numpy as np

def create_gantt_chart(output_path):
    tasks_data = [
        ("Phase 1", "Requirement Gathering & Syllabus Analysis", "2025-10-01", "2025-10-15", "#2B4C7E"),
        ("Phase 1", "Feasibility Study & SRS Documentation", "2025-10-16", "2025-10-25", "#2B4C7E"),
        ("Phase 2", "Database Modeling & Mongoose Schemas", "2025-10-26", "2025-11-08", "#386641"),
        ("Phase 2", "DFD & UML Diagram Architecture", "2025-11-09", "2025-11-20", "#386641"),
        ("Phase 3", "Backend Auth & Express Server Setup", "2025-11-21", "2025-12-05", "#5A189A"),
        ("Phase 3", "Quiz Engine & Dynamic Evaluation Logic", "2025-12-06", "2025-12-24", "#5A189A"),
        ("Phase 3", "Frontend Views & EJS Student Dashboard", "2025-12-25", "2026-01-10", "#5A189A"),
        ("Phase 3", "Technical Modules (SQL & Placement Tracks)", "2026-01-11", "2026-01-22", "#5A189A"),
        ("Phase 4", "Unit Testing & Bug Verification", "2026-01-23", "2026-02-05", "#BC4749"),
        ("Phase 4", "Integration & User Acceptance Testing", "2026-02-06", "2026-02-18", "#BC4749"),
        ("Phase 5", "Final Project Report & Viva Preparation", "2026-02-19", "2026-03-05", "#DDA15E"),
    ]

    tasks = []
    for phase, name, start, end, color in tasks_data:
        d_start = datetime.strptime(start, "%Y-%m-%d")
        d_end = datetime.strptime(end, "%Y-%m-%d")
        tasks.append({
            'phase': phase,
            'name': f"[{phase}]  {name}",
            'start': d_start,
            'end': d_end,
            'days': (d_end - d_start).days + 1,
            'color': '#333333'  # Academic clean dark gray / black outline
        })

    tasks = tasks[::-1]

    fig, ax = plt.subplots(figsize=(14, 8.5), dpi=300)
    fig.patch.set_facecolor('white')
    ax.set_facecolor('white')

    y_pos = np.arange(len(tasks))
    bar_height = 0.50

    for i, t in enumerate(tasks):
        start_num = mdates.date2num(t['start'])
        end_num = mdates.date2num(t['end'])
        duration = end_num - start_num

        # Academic bar styling
        ax.barh(i, duration, left=start_num, height=bar_height,
                align='center', color='#2B2D42', edgecolor='black', linewidth=1.2, zorder=3)

        mid_x = start_num + duration / 2
        ax.text(mid_x, i, f"{t['days']} d",
                ha='center', va='center', color='white', fontsize=8.5, weight='bold',
                family='DejaVu Sans', zorder=4)

        # Start and end date labels at edges of bar
        ax.text(start_num - 0.7, i, t['start'].strftime('%d %b'),
                ha='right', va='center', color='#111111', fontsize=7.5, family='DejaVu Sans', zorder=4)
        ax.text(end_num + 0.7, i, t['end'].strftime('%d %b'),
                ha='left', va='center', color='#111111', fontsize=7.5, family='DejaVu Sans', zorder=4)

    ax.set_yticks(y_pos)
    ax.set_yticklabels([t['name'] for t in tasks], fontsize=9.5, family='DejaVu Sans', weight='normal')

    min_date = datetime(2025, 9, 22)
    max_date = datetime(2026, 3, 16)
    ax.set_xlim(mdates.date2num(min_date), mdates.date2num(max_date))

    # Weekly major ticks
    ax.xaxis.set_major_locator(mdates.WeekdayLocator(byweekday=mdates.MO, interval=2))
    ax.xaxis.set_major_formatter(mdates.DateFormatter('%d-%b-%Y'))
    plt.xticks(rotation=25, ha='right', fontsize=9, family='DejaVu Sans')

    # Gridlines
    ax.grid(True, which='major', axis='x', color='#D8D8D8', linestyle='--', linewidth=0.75, zorder=1)
    ax.grid(True, which='major', axis='y', color='#F0F0F0', linestyle='-', linewidth=0.5, zorder=1)
    ax.set_axisbelow(True)

    for spine in ['top', 'right', 'bottom', 'left']:
        ax.spines[spine].set_color('black')
        ax.spines[spine].set_linewidth(1.2)

    plt.title("Figure 6.1: Gantt Chart — AptitudePro Project Schedule\nAcademic Year 2025–2027 (Department of Computer Applications, MACFAST)",
              fontsize=12, weight='bold', pad=22, family='DejaVu Sans')

    plt.tight_layout()
    plt.savefig(output_path, dpi=300, bbox_inches='tight', pad_inches=0.3)
    plt.close()
    print(f"Refined Gantt Chart saved to {output_path}")

if __name__ == '__main__':
    create_gantt_chart('c:/Users/Brosis/Documents/aptitudepro-mongo/docs/diagrams/gantt_chart.png')
