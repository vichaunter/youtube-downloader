const { exec, execSync } = require('child_process');
const fs = require('fs');
const ytdl = require('ytdl-core');
const ProgressBar = require('progress')
const videos = require('./videos.json')
const config = require('./config.json')

const FORMATS = {
    fullhd: ['1080p60 HDR', '1080p60', '1080p'],
    hd: ['720p']
}

/**
 * Get an array with all the allowed formats for specific qualities
 * 
 * @param {string[]} qualityArr 
 * @returns 
 */
const getValidFormats = (qualityArr = ['fullhd']) => {
    return new Set(qualityArr.reduce((acc, current) => {
        return [...acc, ...FORMATS[current]]
    }, []))
}

const isDockerized = () => {
    try {
        fs.statSync('/.dockerenv');
        return true;
    } catch {
        return false;
    }
}

const joinAudioVideoFiles = (audioFile, videoFile, name) => {
    // run one time docker to join with ffmpeg
    const command = isDockerized()
        //TODO: when in docker -c:a copy will make fail due missing codec, for direct copy use yarn start in host
        ? `ffmpeg -y -i "${audioFile}" -i "${videoFile}" -c:v copy -strict experimental -map 0:0 -map 1:0 "${name}.mp4"`
        : `docker run -v ${process.env.PWD}:${process.env.PWD} -w ${process.env.PWD} jrottenberg/ffmpeg:3.4-scratch -y -i "${audioFile}" -i "${videoFile}" -c:v copy -c:a copy -strict experimental -map 0:0 -map 1:0 "${name}.mp4"`
    console.log("joining video", command)
    return new Promise((resolv, reject) => {
        exec(command, (error, stdout, _) => {
            if (error) {
                reject(error)
                return;
            }
            resolv(stdout)
        });
    }
    )
}

const downloadVideo = (video, videoFileOutput) => {
    return new Promise((resolve, reject) => {

        const formats = video.formats.filter(format => getValidFormats(config.formats).has(format.qualityLabel))
        // pick the best bitrate from the allowed ones
        const biggestBitrate = formats.reduce((prev, curr) => {
            return prev.bitrate > curr.bitrate ? prev : curr
        })
        let bar
        let downloaded = 0
        const stream = ytdl.downloadFromInfo(video, { quality: biggestBitrate.itag })
        stream.pipe(fs.createWriteStream(videoFileOutput))
        stream.on('progress', (_, totalDownloaded, total) => {
            if (!bar) {
                bar = new ProgressBar(`Downloading ${videoFileOutput} [:bar] :percent :etas`, {
                    complete: String.fromCharCode(0x2588),
                    total: total
                })
            } else {
                bar.tick(totalDownloaded - downloaded)
                downloaded = totalDownloaded
            }
        })
        stream.on('finish', () => {
            resolve()
        })

    })

}

const donwloadAudio = (video, audioFileOutput) => {
    return new Promise((resolve, reject) => {
        //get audio formats from video
        const audioFormats = video.formats.filter(format => format.audioBitrate && !format.qualityLabel)
        const biggestAudio = audioFormats.reduce((prev, curr) => {
            return prev.audioBitrate > curr.audioBitrate && curr.container === 'mp4' ? prev : curr
        })
        let bar
        let downloaded = 0
        const stream = ytdl.downloadFromInfo(video, { quality: biggestAudio.itag })
        stream.pipe(fs.createWriteStream(audioFileOutput))
        stream.on('progress', (_, totalDownloaded, total) => {
            if (!bar) {
                bar = new ProgressBar(`Downloading ${audioFileOutput} [:bar] :percent :etas`, {
                    complete: String.fromCharCode(0x2588),
                    total: total
                })
            } else {
                bar.tick(totalDownloaded - downloaded)
                downloaded = totalDownloaded
            }
        })
        stream.on('finish', () => {
            resolve()
        })
    })
}
const download = async (url) => {
    const video = await ytdl.getInfo(url)
    console.log(`Downloading ${video.videoDetails.title} - ${video.videoDetails.title}`)

    const videoFileOutput = `/tmp/video-${video.videoDetails.videoId}.mp4`
    await downloadVideo(video, videoFileOutput)

    const audioFileOutput = `/tmp/audio-${video.videoDetails.videoId}.m4a`
    await donwloadAudio(video, audioFileOutput)
    console.log(video.videoDetails.videoId)
    if (!fs.existsSync(config.downPath)) {
        fs.mkdirSync(config.downPath);
    }
    await joinAudioVideoFiles(audioFileOutput, videoFileOutput, `${config.downPath}/${config.videoPrefix || ''}${video.videoDetails.title}`)

    fs.unlinkSync(videoFileOutput)
    fs.unlinkSync(audioFileOutput)
}


(async () => {
    for (const video of videos) {
        await download(video)
    }
})();

