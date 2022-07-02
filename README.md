# Youtube Downloader

Why of this tool? When you try to download your video from youtube,
depending on the quality and encoding some video streams have not audio.

This is because in this way youtube uses same audio for different videos.

## The idea behind

With this tool, you can choose any video quality, and will be downloaded
the best quality matching your parameters, found the best audio stream
and muxed together.

This way you can get any video resolution with sound without any other
processing.

## Almost Zero library install or dependencies

Made with simplicity in mind, is running with docker, so you don't need
to install ffmpeg, node or anything else to make it work.

Just install Docker for your distribution and follow the next instructions.

- My installation script for linux: [https://gist.github.com/vichaunter/41c0d03bddc4d6c492635e6c6824d517]
- Official instructions: [https://docs.docker.com/get-docker/]

## How to use it

There is 3 simple steps to make it work once you have docker installed.

First of all you need to build the image to have node and ffmpeg working in the
same container:

```
make build

or

docker build . --progress=plain --no-cache -t node-ffmpeg -f ./Dockerfile
```

Once the image is built locally, just add some youtube urls in src/videos.json file:

```
[
    "https://www.youtube.com/watch?v=Zp5BlTymyQ4",
    "https://www.youtube.com/watch?v=Zp5BlTymyQ4",
    "https://www.youtube.com/watch?v=Zp5BlTymyQ4"
]
```

And the last thing you need to do is to run the tool with:

```
make run

or

docker run -it  --rm -v ${PWD}:/app node-ffmpeg
```

## Potential problems

If some docker or make command return not found error remember to run them in your `[projectRoot]`

If you find something or want to improve, help is welcome, just make a pull request

### Make command not found

> You don't need make if you run docker commands directly, is only to make is comfortable

If you don't have make installed (linux), just run as sudo:

```
apt update
apt install make
```
