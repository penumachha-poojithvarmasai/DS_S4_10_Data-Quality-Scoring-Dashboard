import os
import glob
import cv2

frames_dir = r"d:\Project 911\DataScoringDashboard\recorder\frames"
output_video = r"d:\Project 911\DataScoringDashboard\demo_walkthrough.mp4"

frame_files = sorted(glob.glob(os.path.join(frames_dir, "frame_*.jpg")))

if not frame_files:
    print("No frames found!")
    exit(1)

first_frame = cv2.imread(frame_files[0])
height, width, layers = first_frame.shape

fps = 4.0
fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out = cv2.VideoWriter(output_video, fourcc, fps, (width, height))

print(f"Encoding {len(frame_files)} frames into {output_video} at {fps} fps ({width}x{height})...")
for f in frame_files:
    img = cv2.imread(f)
    out.write(img)

out.release()
print(f"Demo video saved successfully: {output_video} (Size: {os.path.getsize(output_video)} bytes)")

