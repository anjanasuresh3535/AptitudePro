import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import Ellipse, Rectangle, Circle
import numpy as np

def create_aptitudepro_use_case_diagram(output_path):
    # Figure size 10.5 x 14 inches at 300 dpi
    fig, ax = plt.subplots(figsize=(10.5, 14), dpi=300)
    ax.set_xlim(0, 105)
    ax.set_ylim(0, 140)
    ax.axis('off')

    LINE_WIDTH = 1.3
    BORDER_COLOR = '#000000'
    FONT_FAMILY = 'DejaVu Sans'

    # 1. System Boundary Box
    box_x = 24
    box_y = 10
    box_w = 52
    box_h = 120
    rect = Rectangle((box_x, box_y), box_w, box_h, fill=False, edgecolor=BORDER_COLOR, linewidth=LINE_WIDTH * 1.3)
    ax.add_patch(rect)

    # System Title at top of boundary box
    ax.text(box_x + box_w/2, box_y + box_h - 4, "AptitudePro System", ha='center', va='center',
            fontsize=12, family=FONT_FAMILY, weight='bold')

    # Helper: Draw Stick Figure
    def draw_actor(cx, cy, label):
        # Head
        head = Circle((cx, cy + 6.5), radius=2.0, fill=False, edgecolor=BORDER_COLOR, linewidth=LINE_WIDTH)
        ax.add_patch(head)
        # Torso
        ax.plot([cx, cx], [cy + 4.5, cy - 2.0], color=BORDER_COLOR, linewidth=LINE_WIDTH)
        # Arms
        ax.plot([cx - 4.0, cx, cx + 4.0], [cy + 1.0, cy + 3.0, cy + 1.0], color=BORDER_COLOR, linewidth=LINE_WIDTH)
        # Legs
        ax.plot([cx - 3.8, cx, cx + 3.8], [cy - 8.5, cy - 2.0, cy - 8.5], color=BORDER_COLOR, linewidth=LINE_WIDTH)
        # Label
        ax.text(cx, cy - 12.0, label, ha='center', va='top', fontsize=10.5, family=FONT_FAMILY, weight='bold')

    # Helper: Draw Oval (Use Case)
    def draw_use_case_oval(cx, cy, w, h, text, font_size=8.5):
        oval = Ellipse((cx, cy), w, h, facecolor='white', edgecolor=BORDER_COLOR, linewidth=LINE_WIDTH)
        ax.add_patch(oval)
        ax.text(cx, cy, text, ha='center', va='center', fontsize=font_size, family=FONT_FAMILY, color='black')

    # Helper: Draw Arrow
    def draw_arrow(x1, y1, x2, y2):
        ax.annotate(
            '', xy=(x2, y2), xytext=(x1, y1),
            arrowprops=dict(facecolor='black', edgecolor='black', arrowstyle='->',
                            linewidth=LINE_WIDTH, shrinkA=0, shrinkB=0, mutation_scale=12)
        )

    # ========== LEFT COLUMN: STUDENT / CANDIDATE USE CASES ==========
    left_oval_x = 36
    left_oval_w = 17.5
    left_oval_h = 6.2

    # 9 ovals for Student
    left_ys = [114, 102, 90, 78, 66, 54, 42, 30, 18]
    left_labels = [
        "Register",
        "Login",
        "Select Topic\n& Difficulty",
        "Attempt Practice\nQuiz",
        "Take Company\nTrack Test",
        "Coding & SQL\nLab Challenge",
        "View Scorecard\n& XP Earned",
        "Review Solutions\n& Explanations",
        "View Global\nLeaderboard"
    ]

    for y, label in zip(left_ys, left_labels):
        draw_use_case_oval(left_oval_x, y, left_oval_w, left_oval_h, label, font_size=8.0)

    # Left Actor: Student / Candidate
    student_x = 9
    student_y = 66
    draw_actor(student_x, student_y, "Student /\nCandidate")

    # Connect Student to left ovals via orthogonal bus line
    bus_x_left = 21
    ax.plot([student_x + 4.0, bus_x_left], [student_y + 1.5, student_y + 1.5], color=BORDER_COLOR, linewidth=LINE_WIDTH)
    ax.plot([bus_x_left, bus_x_left], [left_ys[0], left_ys[-1]], color=BORDER_COLOR, linewidth=LINE_WIDTH)

    oval_left_edge = left_oval_x - left_oval_w / 2
    for y in left_ys:
        draw_arrow(bus_x_left, y, oval_left_edge, y)

    # ========== RIGHT COLUMN: ADMINISTRATOR USE CASES ==========
    right_oval_x = 64
    right_oval_w = 17.5
    right_oval_h = 6.2

    # 7 ovals for Admin (well centered vertically)
    right_ys = [108, 95, 82, 69, 56, 43, 30]
    right_labels = [
        "Admin Login",
        "Manage Question\nBank (CRUD)",
        "Configure Company\nTracks",
        "Manage User\nAccounts",
        "View Performance\nAnalytics",
        "Monitor System\nAudit Logs",
        "System Backup\n& Maintenance"
    ]

    for y, label in zip(right_ys, right_labels):
        draw_use_case_oval(right_oval_x, y, right_oval_w, right_oval_h, label, font_size=8.0)

    # Right Actor: Administrator
    admin_x = 95
    admin_y = 69
    draw_actor(admin_x, admin_y, "Administrator")

    # Connect Administrator to right ovals via orthogonal bus line
    bus_x_right = 79
    ax.plot([admin_x - 4.0, bus_x_right], [admin_y + 1.5, admin_y + 1.5], color=BORDER_COLOR, linewidth=LINE_WIDTH)
    ax.plot([bus_x_right, bus_x_right], [right_ys[0], right_ys[-1]], color=BORDER_COLOR, linewidth=LINE_WIDTH)

    oval_right_edge = right_oval_x + right_oval_w / 2
    for y in right_ys:
        draw_arrow(bus_x_right, y, oval_right_edge, y)

    plt.tight_layout()
    plt.savefig(output_path, dpi=300, bbox_inches='tight', pad_inches=0.2)
    plt.close()
    print(f"Use Case diagram saved to {output_path}")

if __name__ == '__main__':
    create_aptitudepro_use_case_diagram('c:/Users/Brosis/Documents/aptitudepro-mongo/docs/diagrams/use_case_diagram_model.png')
