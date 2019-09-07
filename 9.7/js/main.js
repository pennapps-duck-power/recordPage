/*
*  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
*
*  Use of this source code is governed by a BSD-style license
*  that can be found in the LICENSE file in the root of the source
*  tree.
*/

// This code is adapted from
// https://rawgit.com/Miguelao/demos/master/mediarecorder.html

'use strict';

/* globals MediaRecorder */

const mediaSource = new MediaSource();
mediaSource.addEventListener('sourceopen', handleSourceOpen, false);
let mediaRecorder;
let recordedVideoBlobs;
let sourceBuffer;

const errorMsgElement = document.querySelector('span#errorMsg');
const recordedVideo = document.querySelector('video#recorded');

const recordButton = document.querySelector('button#record');
recordButton.addEventListener('click', () => {
  if (recordButton.textContent === 'Start Recording') {
    startRecording();
  } else {
    stopRecording();
    recordButton.textContent = 'Start Recording';
    playButton.disabled = false;
    uploadButton.disabled = false;
  }
});

const playButton = document.querySelector('button#play');
playButton.addEventListener('click', () => {
  const superBuffer = new Blob(recordedVideoBlobs, {type: 'video/mp4'});
  recordedVideo.src = null;
  recordedVideo.srcObject = null;
  recordedVideo.src = window.URL.createObjectURL(superBuffer);
  recordedVideo.controls = true;
  recordedVideo.play();
});

const uploadButton = document.querySelector('button#upload');
uploadButton.addEventListener('click', () => {
  const videoBlob = new Blob(recordedVideoBlobs, {type: 'video/mp4'});
  const audioBlob = new Blob(recordedVideoBlobs, {type: "audio/mp4"});

  const videoUrl = window.URL.createObjectURL(videoBlob);
  const videoElement = document.createElement('a');
  videoElement.style.display = 'none';
  videoElement.href = videoUrl;
  videoElement.download = 'test_video.mp4';
  document.body.appendChild(videoElement);
  videoElement.click();
  setTimeout(() => {
    document.body.removeChild(videoElement);
    window.URL.revokeObjectURL(videoUrl);
  }, 100);

  const audioUrl = window.URL.createObjectURL(audioBlob);
  const audioElement = document.createElement('a');
  audioElement.style.display = 'none';
  audioElement.href = audioUrl;
  audioElement.download = 'test_audio.mp4';
  document.body.appendChild(audioElement);
  audioElement.click();
  setTimeout(() => {
    document.body.removeChild(audioElement);
    window.URL.revokeObjectURL(audioUrl);
  }, 100);
});

function handleSourceOpen(event) {
  console.log('MediaSource opened');
  sourceBuffer = mediaSource.addSourceBuffer('video/mp4');
  console.log('Source buffer: ', sourceBuffer);
}

function handleDataAvailable(event) {
  if (event.data && event.data.size > 0) {
    recordedVideoBlobs.push(event.data);
  }
}

function startRecording() {
  recordedVideoBlobs = [];
  let videoOptions = {mimeType: 'video/webm\;codecs=h264'};
  if (!MediaRecorder.isTypeSupported(videoOptions.mimeType)) {
    console.error(`${videoOptions.mimeType} is not Supported`);
    errorMsgElement.innerHTML = `${videoOptions.mimeType} is not Supported`;
  }

  try {
    mediaRecorder = new MediaRecorder(window.stream, videoOptions);
  } catch (e) {
    console.error('Exception while creating MediaRecorder:', e);
    errorMsgElement.innerHTML = `Exception while creating MediaRecorder: ${JSON.stringify(e)}`;
    return;
  }

  recordButton.textContent = 'Stop Recording';
  playButton.disabled = true;
  uploadButton.disabled = true;
  mediaRecorder.onstop = (event) => {
    console.log('Recorder stopped: ', event);
  };
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start(10); // collect 10ms of data
  console.log('MediaRecorder started', mediaRecorder);
}

function stopRecording() {
  mediaRecorder.stop();
  console.log('Recorded Blobs: ', recordedVideoBlobs);
}

function handleSuccess(stream) {
  recordButton.disabled = false;
  console.log('getUserMedia() got stream:', stream);
  window.stream = stream;

  const gumVideo = document.querySelector('video#gum');
  gumVideo.srcObject = stream;
}

async function init(constraints) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    handleSuccess(stream);
  } catch (e) {
    console.error('navigator.getUserMedia error:', e);
    errorMsgElement.innerHTML = `navigator.getUserMedia error:${e.toString()}`;
  }
}

document.querySelector('button#start').addEventListener('click', async () => {
  // const hasEchoCancellation = document.querySelector('#echoCancellation').checked;
  const constraints = {
    audio: {
      echoCancellation: true
      // {exact: hasEchoCancellation}
    },
    video: {
      width: 1280, height: 720
    }
  };
  console.log('Using media constraints:', constraints);
  await init(constraints);
});


