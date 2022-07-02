rebuild:
	docker rmi node-ffmpeg -f
	docker build . --progress=plain --no-cache -t node-ffmpeg -f ./Dockerfile

run:
	docker run -it  --rm -v ${PWD}:/app node-ffmpeg