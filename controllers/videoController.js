const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

ffmpeg.setFfmpegPath(ffmpegPath);

exports.convertVideo = (req, res) => {
  const inputPath = req.file.path;
  const outputDir = path.join(__dirname, '../outputs', uuidv4());
  fs.mkdirSync(outputDir, { recursive: true });

  const qualities = [
    { name: '1080p', size: '1920x1080' },
    { name: '720p', size: '1280x720' },
    { name: '480p', size: '854x480' },
    { name: '360p', size: '640x360' },
  ];

  let ffmpegCommand = ffmpeg(inputPath)
    .outputOptions([
      '-preset fast',
      '-g 48',
      '-sc_threshold 0',
      '-hls_time 10',
      '-hls_playlist_type vod',
    ]);

  qualities.forEach(quality => {
    ffmpegCommand = ffmpegCommand.output(path.join(outputDir, `${quality.name}.m3u8`))
      .videoCodec('libx264')
      .size(quality.size)
      .outputOptions([
        `-hls_segment_filename ${path.join(outputDir, `${quality.name}_%03d.ts`)}`,
        '-c:a aac',
        '-ar 48000',
        '-b:a 128k',
      ]);
  });

  ffmpegCommand.on('end', () => {
    const masterPlaylistPath = path.join(outputDir, 'master.m3u8');
    const masterPlaylistContent = qualities.map(quality => {
      return `#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=${quality.size}\n${quality.name}.m3u8`;
    }).join('\n');

    fs.writeFileSync(masterPlaylistPath, masterPlaylistContent);

    const publicMasterPlaylistPath = `/outputs/${path.basename(outputDir)}/master.m3u8`;
    res.json({ masterPlaylistPath: publicMasterPlaylistPath });
  }).on('error', err => {
    console.error(err);
    res.status(500).send('Error processing video');
  }).run();
};
