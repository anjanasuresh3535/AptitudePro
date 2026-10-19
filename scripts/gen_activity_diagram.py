import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Circle, Polygon
import numpy as np

def create_activity_diagram(output_path):
    # High resolution figure (width=8.5, height=14 inches, 300 dpi)
    fig, ax = plt.subplots(figsize=(9, 15), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(-14, 160)
    ax.axis('off')

    # Styling constants
    BOX_BG = '#FFFFFF'
    BORDER_COLOR = '#000000'
    LINE_WIDTH = 1.3
    FONT_FAMILY = 'DejaVu Sans'

    # Helper: draw rounded action box
    def draw_action_box(cx, cy, w, h, text, font_size=9, font_weight='normal'):
        box = FancyBboxPatch(
            (cx - w/2, cy - h/2), w, h,
            boxstyle="round,pad=0.2,rounding_size=1.2",
            facecolor=BOX_BG, edgecolor=BORDER_COLOR, linewidth=LINE_WIDTH
        )
        ax.add_patch(box)
        ax.text(cx, cy, text, ha='center', va='center', fontsize=font_size,
                family=FONT_FAMILY, weight=font_weight, color='black')

    # Helper: draw diamond decision
    def draw_decision(cx, cy, w, h, text, font_size=8.5):
        pts = np.array([
            [cx, cy + h/2],
            [cx + w/2, cy],
            [cx, cy - h/2],
            [cx - w/2, cy]
        ])
        poly = Polygon(pts, closed=True, facecolor=BOX_BG, edgecolor=BORDER_COLOR, linewidth=LINE_WIDTH)
        ax.add_patch(poly)
        ax.text(cx, cy, text, ha='center', va='center', fontsize=font_size,
                family=FONT_FAMILY, weight='normal', color='black')

    # Helper: draw arrow
    def draw_arrow(x1, y1, x2, y2, label=None, label_pos='right', label_offset=1.5, font_size=8):
        ax.annotate(
            '', xy=(x2, y2), xytext=(x1, y1),
            arrowprops=dict(facecolor='black', edgecolor='black', arrowstyle='->',
                            linewidth=LINE_WIDTH, shrinkA=0, shrinkB=0, mutation_scale=12)
        )
        if label:
            mx, my = (x1 + x2) / 2, (y1 + y2) / 2
            if label_pos == 'right':
                ax.text(mx + label_offset, my, label, ha='left', va='center', fontsize=font_size, family=FONT_FAMILY)
            elif label_pos == 'left':
                ax.text(mx - label_offset, my, label, ha='right', va='center', fontsize=font_size, family=FONT_FAMILY)
            elif label_pos == 'top':
                ax.text(mx, my + label_offset, label, ha='center', va='bottom', fontsize=font_size, family=FONT_FAMILY)
            elif label_pos == 'bottom':
                ax.text(mx, my - label_offset, label, ha='center', va='top', fontsize=font_size, family=FONT_FAMILY)

    # Helper: draw orthogonal polyline arrow
    def draw_poly_arrow(points, label=None, label_pt=None, label_align=('left', 'center'), font_size=8):
        for i in range(len(points) - 1):
            p1, p2 = points[i], points[i+1]
            if i == len(points) - 2:
                # Last segment gets the arrowhead
                ax.annotate(
                    '', xy=p2, xytext=p1,
                    arrowprops=dict(facecolor='black', edgecolor='black', arrowstyle='->',
                                    linewidth=LINE_WIDTH, shrinkA=0, shrinkB=0, mutation_scale=12)
                )
            else:
                ax.plot([p1[0], p2[0]], [p1[1], p2[1]], color='black', linewidth=LINE_WIDTH)
        if label and label_pt:
            ax.text(label_pt[0], label_pt[1], label, ha=label_align[0], va=label_align[1],
                    fontsize=font_size, family=FONT_FAMILY)

    # 1. Start Node (Filled Circle)
    start_circle = Circle((50, 154), radius=1.6, facecolor='black', edgecolor='black', linewidth=LINE_WIDTH)
    ax.add_patch(start_circle)

    # Arrow to User Login
    draw_arrow(50, 152.4, 50, 148.5)

    # 2. User Login
    draw_action_box(50, 146, 26, 5.0, "User Login", font_size=9.5)
    draw_arrow(50, 143.5, 50, 139)

    # 3. Decision: Role?
    draw_decision(50, 136, 18, 6.0, "Role?", font_size=9)

    # Left: Student, Center: Candidate, Right: Admin
    draw_poly_arrow([(41, 136), (24, 136), (24, 127)], label="Student", label_pt=(32, 137.5), label_align=('center', 'bottom'))
    draw_action_box(24, 124, 24, 5.5, "Join / Login\nas Student", font_size=8.5)

    draw_arrow(50, 133, 50, 127, label="Candidate", label_pos='right', label_offset=1.2)
    draw_action_box(50, 124, 22, 5.5, "Practice / Mock\nCandidate", font_size=8.5)

    draw_poly_arrow([(59, 136), (76, 136), (76, 127)], label="Admin", label_pt=(68, 137.5), label_align=('center', 'bottom'))
    draw_action_box(76, 124, 22, 5.5, "Login\nas Admin", font_size=8.5)

    # Converge to Dashboard
    draw_poly_arrow([(24, 121.25), (24, 115), (40, 115)])
    draw_arrow(50, 121.25, 50, 117.5)
    draw_poly_arrow([(76, 121.25), (76, 115), (60, 115)])

    # 4. Dashboard
    draw_action_box(50, 115, 20, 5.0, "Dashboard", font_size=9.5)
    draw_arrow(50, 112.5, 50, 107.5)

    # 5. Select Action
    draw_action_box(50, 105, 24, 5.0, "Select Action", font_size=9.5)

    # 4 Action boxes side-by-side:
    draw_poly_arrow([(38, 102.5), (38, 98), (17, 98), (17, 94)])
    draw_poly_arrow([(44, 102.5), (39, 98), (39, 94)])
    draw_poly_arrow([(56, 102.5), (61, 98), (61, 94)])
    draw_poly_arrow([(62, 102.5), (62, 98), (83, 98), (83, 94)])

    draw_action_box(17, 91, 19, 5.5, "Topic Practice\n(Aptitude / Core)", font_size=7.5)
    draw_action_box(39, 91, 19, 5.5, "Company Tracks\n(TCS / Wipro / CTS)", font_size=7.5)
    draw_action_box(61, 91, 19, 5.5, "Coding & SQL\nInteractive Lab", font_size=7.5)
    draw_action_box(83, 91, 19, 5.5, "Manage Content\n(For Admin)", font_size=7.5)

    # Merge below the 4 boxes at y=85, then a single line into Enter Details at y=79
    ax.plot([17, 83], [85, 85], color='black', linewidth=LINE_WIDTH)
    ax.plot([17, 17], [88.25, 85], color='black', linewidth=LINE_WIDTH)
    ax.plot([39, 39], [88.25, 85], color='black', linewidth=LINE_WIDTH)
    ax.plot([61, 61], [88.25, 85], color='black', linewidth=LINE_WIDTH)
    ax.plot([83, 83], [88.25, 85], color='black', linewidth=LINE_WIDTH)
    draw_arrow(50, 85, 50, 81.5)

    # 6. Enter Details / Select Configuration
    draw_action_box(50, 79, 28, 5.0, "Enter Details", font_size=9)
    draw_arrow(50, 76.5, 50, 72.5)

    # 7. Process Request
    draw_action_box(50, 70, 26, 5.0, "Process Request", font_size=9)
    draw_arrow(50, 67.5, 50, 63.5)

    # 8. Decision: Valid Details?
    draw_decision(50, 60.5, 22, 6.0, "Valid Details?", font_size=8.5)

    # No branch: Show Error Message -> loops back into Enter Details
    draw_poly_arrow([(39, 60.5), (25, 60.5)], label="No", label_pt=(32, 62), label_align=('center', 'bottom'))
    draw_action_box(16, 60.5, 17, 5.0, "Show Error Message", font_size=7.5)
    draw_poly_arrow([(16, 63), (16, 79), (36, 79)])

    # Yes branch:
    draw_arrow(50, 57.5, 50, 53, label="Yes", label_pos='right', label_offset=1.2)

    # 9. Display Results
    draw_action_box(50, 50.5, 26, 5.0, "Display Results", font_size=9)
    draw_arrow(50, 48, 50, 44)

    # 10. Decision: Submission Confirmed?
    draw_decision(50, 41, 26, 6.0, "Book / Request\nConfirmed?", font_size=8)

    # No branch: Show Message (Booking/Request Failed) -> loops back to Dashboard
    draw_poly_arrow([(63, 41), (74, 41)], label="No", label_pt=(68, 42.5), label_align=('center', 'bottom'))
    draw_action_box(86, 41, 23, 5.0, "Show Message\n(Attempt Incomplete)", font_size=7.5)
    draw_poly_arrow([(97.5, 41), (98.5, 41), (98.5, 115), (60, 115)])

    # Yes branch:
    draw_arrow(50, 38, 50, 33.5, label="Yes", label_pos='right', label_offset=1.2)

    # 11. Save to Database
    draw_action_box(50, 31, 26, 5.0, "Save to Database", font_size=9)
    draw_arrow(50, 28.5, 50, 24.5)

    # 12. Show Confirmation Message
    draw_action_box(50, 22, 30, 5.0, "Show Confirmation Message", font_size=9)
    draw_arrow(50, 19.5, 50, 15.5)

    # 13. Update Dashboard
    draw_action_box(50, 13, 26, 5.0, "Update Dashboard", font_size=9)
    draw_arrow(50, 10.5, 50, 7.0)

    # 14. Decision: Logout?
    draw_decision(50, 4, 18, 5.5, "Logout?", font_size=8.5)

    # No branch: loop back to Dashboard on left side
    draw_poly_arrow([(41, 4), (4, 4), (4, 115), (40, 115)], label="No", label_pt=(22, 5.5), label_align=('center', 'bottom'))

    # Yes branch:
    draw_arrow(50, 1.25, 50, -2.5, label="Yes", label_pos='right', label_offset=1.2)

    # 15. End Session
    draw_action_box(50, -5, 22, 4.5, "End Session", font_size=9)

    # Final Node (Bullseye circle: outer ring + inner filled dot)
    draw_arrow(50, -7.25, 50, -10.0)
    outer_circle = Circle((50, -11.5), radius=2.0, facecolor='white', edgecolor='black', linewidth=LINE_WIDTH)
    inner_circle = Circle((50, -11.5), radius=1.2, facecolor='black', edgecolor='black', linewidth=LINE_WIDTH)
    ax.add_patch(outer_circle)
    ax.add_patch(inner_circle)

    plt.tight_layout()
    plt.savefig(output_path, dpi=300, bbox_inches='tight', pad_inches=0.2)
    plt.close()
    print(f"Activity diagram saved to {output_path}")

if __name__ == '__main__':
    create_activity_diagram('c:/Users/Brosis/Documents/aptitudepro-mongo/docs/diagrams/activity_diagram_model.png')
