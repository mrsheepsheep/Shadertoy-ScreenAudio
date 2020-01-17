EffectPass.prototype.NewTexture = function (wa, slot, url, buffers, cubeBuffers, keyboard) {
    var me = this;
    var renderer = this.mRenderer;

    if (renderer == null) return;

    var texture = null;

    if (url == null || url.mType == null) {
        if (me.mTextureCallbackFun != null)
            me.mTextureCallbackFun(this.mTextureCallbackObj, slot, null, true, 0, 0, -1.0, me.mID);
        me.DestroyInput(slot);
        me.mInputs[slot] = null;
        me.MakeHeader();
        return {
            mFailed: false,
            mNeedsShaderCompile: false
        };
    } else if (url.mType == "texture") {
        texture = {};
        texture.mInfo = url;
        texture.globject = null;
        texture.loaded = false;
        texture.image = new Image();
        texture.image.crossOrigin = '';
        texture.image.onload = function () {
            var rti = me.Sampler2Renderer(url.mSampler);

            // O.M.G. IQIQ FIX THIS
            var channels = renderer.TEXFMT.C4I8;
            if (url.mID == "Xdf3zn" || url.mID == "4sf3Rn" || url.mID == "4dXGzn" || url.mID == "4sf3Rr")
                channels = renderer.TEXFMT.C1I8;

            texture.globject = renderer.CreateTextureFromImage(renderer.TEXTYPE.T2D, texture.image, channels, rti.mFilter, rti.mWrap, rti.mVFlip);

            texture.loaded = true;
            if (me.mTextureCallbackFun != null)
                me.mTextureCallbackFun(me.mTextureCallbackObj, slot, texture.image, true, 1, 1, -1.0, me.mID);
        }
        texture.image.src = url.mSrc;


        var returnValue = {
            mFailed: false,
            mNeedsShaderCompile: (this.mInputs[slot] == null) || (
                (this.mInputs[slot].mInfo.mType != "texture") &&
                (this.mInputs[slot].mInfo.mType != "webcam") &&
                (this.mInputs[slot].mInfo.mType != "mic") &&
                (this.mInputs[slot].mInfo.mType != "music") &&
                (this.mInputs[slot].mInfo.mType != "musicstream") &&
                (this.mInputs[slot].mInfo.mType != "keyboard") &&
                (this.mInputs[slot].mInfo.mType != "video"))
        };
        this.DestroyInput(slot);
        this.mInputs[slot] = texture;
        this.MakeHeader();
        return returnValue;
    } else if (url.mType == "volume") {
        texture = {};
        texture.mInfo = url;
        texture.globject = null;
        texture.loaded = false;
        texture.mImage = {
            mData: null,
            mXres: 1,
            mYres: 0,
            mZres: 0
        };
        texture.mPreview = new Image();
        texture.mPreview.crossOrigin = '';

        var xmlHttp = new XMLHttpRequest();
        if (xmlHttp == null) return {
            mFailed: true
        };

        xmlHttp.open('GET', url.mSrc, true);
        xmlHttp.responseType = "arraybuffer";
        xmlHttp.onerror = function () {}
        xmlHttp.onload = function () {
            var data = xmlHttp.response;
            if (!data) return;

            var file = piFile(data);

            var signature = file.ReadUInt32();
            texture.mImage.mXres = file.ReadUInt32();
            texture.mImage.mYres = file.ReadUInt32();
            texture.mImage.mZres = file.ReadUInt32();
            var binNumChannels = file.ReadUInt8();
            var binLayout = file.ReadUInt8();
            var binFormat = file.ReadUInt16();
            var format = renderer.TEXFMT.C1I8;
            if (binNumChannels == 1 && binFormat == 0) format = renderer.TEXFMT.C1I8;
            else if (binNumChannels == 2 && binFormat == 0) format = renderer.TEXFMT.C2I8;
            else if (binNumChannels == 3 && binFormat == 0) format = renderer.TEXFMT.C3I8;
            else if (binNumChannels == 4 && binFormat == 0) format = renderer.TEXFMT.C4I8;
            else if (binNumChannels == 1 && binFormat == 10) format = renderer.TEXFMT.C1F32;
            else if (binNumChannels == 2 && binFormat == 10) format = renderer.TEXFMT.C2F32;
            else if (binNumChannels == 3 && binFormat == 10) format = renderer.TEXFMT.C3F32;
            else if (binNumChannels == 4 && binFormat == 10) format = renderer.TEXFMT.C4F32;
            else return;

            var buffer = new Uint8Array(data, 20); // skip 16 bytes (header of .bin)

            var rti = me.Sampler2Renderer(url.mSampler);

            texture.globject = renderer.CreateTexture(renderer.TEXTYPE.T3D, texture.mImage.mXres, texture.mImage.mYres, format, rti.mFilter, rti.mWrap, buffer);

            if (texture.globject == null) return {
                mFailed: true
            };

            if (me.mTextureCallbackFun != null) {
                me.mTextureCallbackFun(me.mTextureCallbackObj, slot, texture.mPreview, true, 1, 1, -1.0, me.mID);
            }

            texture.loaded = true;

            // load icon for it
            texture.mPreview.onload = function () {
                if (me.mTextureCallbackFun != null)
                    me.mTextureCallbackFun(me.mTextureCallbackObj, slot, texture.mPreview, true, 1, 1, -1.0, me.mID);
            }
            texture.mPreview.src = url.mPreviewSrc;
        }
        xmlHttp.send("");


        var returnValue = {
            mFailed: false,
            mNeedsShaderCompile: (this.mInputs[slot] == null) || (
                (this.mInputs[slot].mInfo.mType != "volume"))
        };
        this.DestroyInput(slot);
        this.mInputs[slot] = texture;
        this.MakeHeader();
        return returnValue;
    } else if (url.mType == "cubemap") {
        texture = {};
        texture.mInfo = url;
        texture.globject = null;
        texture.loaded = false;

        var rti = me.Sampler2Renderer(url.mSampler);

        if (assetID_to_cubemapBuferID(url.mID) != -1) {
            texture.mImage = new Image();
            texture.mImage.onload = function () {
                texture.loaded = true;
                if (me.mTextureCallbackFun != null)
                    me.mTextureCallbackFun(me.mTextureCallbackObj, slot, texture.mImage, true, 2, 1, -1.0, me.mID);
            }
            texture.mImage.src = "/media/previz/cubemap00.png";

            this.mEffect.ResizeCubemapBuffer(0, 1024, 1024);

        } else {
            texture.image = [new Image(), new Image(), new Image(), new Image(), new Image(), new Image()];

            var numLoaded = 0;
            for (var i = 0; i < 6; i++) {
                texture.image[i].mId = i;
                texture.image[i].crossOrigin = '';
                texture.image[i].onload = function () {
                    var id = this.mId;
                    numLoaded++;
                    if (numLoaded == 6) {
                        texture.globject = renderer.CreateTextureFromImage(renderer.TEXTYPE.CUBEMAP, texture.image, renderer.TEXFMT.C4I8, rti.mFilter, rti.mWrap, rti.mVFlip);
                        texture.loaded = true;
                        if (me.mTextureCallbackFun != null)
                            me.mTextureCallbackFun(me.mTextureCallbackObj, slot, texture.image[0], true, 2, 1, -1.0, me.mID);
                    }
                }

                if (i == 0) {
                    texture.image[i].src = url.mSrc;
                } else {
                    var n = url.mSrc.lastIndexOf(".");
                    texture.image[i].src = url.mSrc.substring(0, n) + "_" + i + url.mSrc.substring(n, url.mSrc.length);
                }
            }
        }

        var returnValue = {
            mFailed: false,
            mNeedsShaderCompile: (this.mInputs[slot] == null) || (
                (this.mInputs[slot].mInfo.mType != "cubemap"))
        };

        this.DestroyInput(slot);
        this.mInputs[slot] = texture;
        this.MakeHeader();
        return returnValue;
    } else if (url.mType === "webcam") {
        texture = {};
        texture.mInfo = url;
        texture.globject = null;
        texture.loaded = false;

        texture.video = document.createElement('video');
        texture.video.width = 320;
        texture.video.height = 240;
        texture.video.autoplay = true;
        texture.video.loop = true;
        texture.video.stream = null;
        texture.mForceMuted = this.mForceMuted;
        texture.mImage = null;

        var rti = me.Sampler2Renderer(url.mSampler);

        var loadImageInsteadOfWebCam = function () {
            texture.mImage = new Image();
            texture.mImage.onload = function () {
                texture.loaded = true;
                texture.globject = renderer.CreateTextureFromImage(renderer.TEXTYPE.T2D, texture.mImage, renderer.TEXFMT.C4I8, rti.mFilter, rti.mWrap, rti.mVFlip);
                if (me.mTextureCallbackFun != null)
                    me.mTextureCallbackFun(me.mTextureCallbackObj, slot, texture.mImage, true, 7, 1, -1.0, me.mID);
            }
            texture.mImage.src = "/media/previz/webcam.png";
        }

        loadImageInsteadOfWebCam();

        if (typeof navigator.getUserMedia !== "undefined" && texture.mForceMuted === false) {
            texture.video.addEventListener("canplay", function (e) {
                try {
                    texture.mImage = null;
                    if (texture.globject != null)
                        renderer.DestroyTexture(texture.globject);
                    texture.globject = renderer.CreateTextureFromImage(renderer.TEXTYPE.T2D, texture.video, renderer.TEXFMT.C4I8, rti.mFilter, rti.mWrap, rti.mVFlip);
                    texture.loaded = true;
                } catch (e) {
                    loadImageInsteadOfWebCam();
                    alert('Your browser can not transfer webcam data to the GPU.');
                }
            });

            navigator.mediaDevices.getUserMedia({
                    "video": {
                        width: {
                            min: 640,
                            ideal: 1280,
                            max: 1920
                        },
                        height: {
                            min: 480,
                            ideal: 720,
                            max: 1080
                        },
                        frameRate: {
                            min: 10,
                            ideal: 30,
                            max: 30
                        }
                    },
                    "audio": false
                })
                .then(function (stream) {
                    texture.video.srcObject = stream;
                })
                .catch(function (error) {
                    loadImageInsteadOfWebCam();
                    alert('Unable to capture WebCam. Please reload the page.');
                });
        }
        var returnValue = {
            mFailed: false,
            mNeedsShaderCompile: (this.mInputs[slot] == null) || (
                (this.mInputs[slot].mInfo.mType != "texture") &&
                (this.mInputs[slot].mInfo.mType != "webcam") &&
                (this.mInputs[slot].mInfo.mType != "mic") &&
                (this.mInputs[slot].mInfo.mType != "music") &&
                (this.mInputs[slot].mInfo.mType != "musicstream") &&
                (this.mInputs[slot].mInfo.mType != "keyboard") &&
                (this.mInputs[slot].mInfo.mType != "video"))
        };
        this.DestroyInput(slot);
        this.mInputs[slot] = texture;
        this.MakeHeader();
        return returnValue;
    } else if (url.mType == "mic") {
        texture = {};
        texture.mInfo = url;
        texture.globject = null;
        texture.loaded = false;
        texture.mForceMuted = this.mForceMuted;
        texture.mAnalyser = null;
        var num = 512;
        texture.mFreqData = new Uint8Array(num);
        texture.mWaveData = new Uint8Array(num);

        if (wa == null || typeof navigator.getUserMedia === "undefined") {
            if (!texture.mForceMuted) alert("Shadertoy: Web Audio not implement in this browser");
            texture.mForceMuted = true;
        }


        if (texture.mForceMuted) {
            texture.globject = renderer.CreateTexture(renderer.TEXTYPE.T2D, num, 2, renderer.TEXFMT.C1I8, renderer.FILTER.LINEAR, renderer.TEXWRP.CLAMP, null)
            texture.loaded = true;
        } else {
            // MODIFIED HERE
            navigator.mediaDevices.getDisplayMedia({
                "video": true,
                "audio": true
            }).then(
                function (stream) {
                    texture.globject = renderer.CreateTexture(renderer.TEXTYPE.T2D, 512, 2, renderer.TEXFMT.C1I8, renderer.FILTER.LINEAR, null)
                    texture.mic = wa.createMediaStreamSource(stream);
                    texture.mAnalyser = wa.createAnalyser();
                    texture.mic.connect(texture.mAnalyser);
                    texture.loaded = true;
                }
            );
        }
        var returnValue = {
            mFailed: false,
            mNeedsShaderCompile: (this.mInputs[slot] == null) || (
                (this.mInputs[slot].mInfo.mType != "texture") &&
                (this.mInputs[slot].mInfo.mType != "webcam") &&
                (this.mInputs[slot].mInfo.mType != "mic") &&
                (this.mInputs[slot].mInfo.mType != "music") &&
                (this.mInputs[slot].mInfo.mType != "musicstream") &&
                (this.mInputs[slot].mInfo.mType != "keyboard") &&
                (this.mInputs[slot].mInfo.mType != "video"))
        };
        this.DestroyInput(slot);
        this.mInputs[slot] = texture;
        this.MakeHeader();
        return returnValue;
    } else if (url.mType == "video") {
        texture = {};
        texture.mInfo = url;
        texture.globject = null;
        texture.loaded = false;
        texture.video = document.createElement('video');
        texture.video.loop = true;
        texture.video.preload = "auto";
        texture.video.mPaused = this.mForcePaused;
        texture.video.mMuted = true; //this.mForceMuted;
        texture.video.muted = true; //this.mForceMuted;
        if (this.mForceMuted == true)
            texture.video.volume = 0;
        texture.video.autoplay = false;
        texture.video.hasFalled = false;

        var rti = me.Sampler2Renderer(url.mSampler);

        texture.video.addEventListener("canplay", function (e) {
            texture.video.play().then(function () {
                    texture.video.mPaused = false;

                    texture.globject = renderer.CreateTextureFromImage(renderer.TEXTYPE.T2D, texture.video, renderer.TEXFMT.C4I8, rti.mFilter, rti.mWrap, rti.mVFlip);
                    texture.loaded = true;

                    if (me.mTextureCallbackFun != null)
                        me.mTextureCallbackFun(me.mTextureCallbackObj, slot, texture.video, true, 3, 1, -1.0, me.mID);
                })
                .catch(function (error) {
                    console.log(error);
                });
        });

        texture.video.addEventListener("error", function (e) {
            if (texture.video.hasFalled == true) {
                alert("Error: cannot load video");
                return;
            }
            var str = texture.video.src;
            str = str.substr(0, str.lastIndexOf('.')) + ".mp4";
            texture.video.src = str;
            texture.video.hasFalled = true;
        });

        texture.video.src = url.mSrc;

        var returnValue = {
            mFailed: false,
            mNeedsShaderCompile: (this.mInputs[slot] == null) || (
                (this.mInputs[slot].mInfo.mType != "texture") &&
                (this.mInputs[slot].mInfo.mType != "webcam") &&
                (this.mInputs[slot].mInfo.mType != "mic") &&
                (this.mInputs[slot].mInfo.mType != "music") &&
                (this.mInputs[slot].mInfo.mType != "musicstream") &&
                (this.mInputs[slot].mInfo.mType != "keyboard") &&
                (this.mInputs[slot].mInfo.mType != "video"))
        };
        this.DestroyInput(slot);
        this.mInputs[slot] = texture;
        this.MakeHeader();
        return returnValue;
    } else if (url.mType == "music" || url.mType == "musicstream") {
        texture = {};
        texture.mInfo = url;
        texture.globject = null;
        texture.loaded = false;
        texture.audio = document.createElement('audio');
        texture.audio.loop = true;
        texture.audio.mMuted = this.mForceMuted;
        texture.audio.mForceMuted = this.mForceMuted;
        texture.audio.muted = this.mForceMuted;
        if (this.mForceMuted == true)
            texture.audio.volume = 0;
        texture.audio.autoplay = false;
        texture.audio.hasFalled = false;
        texture.audio.mPaused = false;
        texture.audio.mSound = {};

        if (this.mForceMuted == false) {
            if (url.mType == "musicstream" && SC == null) {
                alert("Shadertoy: Soundcloud could not be reached");
                texture.audio.mForceMuted = true;
            }
        }

        if (wa == null && this.mForceMuted == false) {
            alert("Shadertoy: Web Audio not implement in this browser");
            texture.audio.mForceMuted = true;
        }

        if (texture.audio.mForceMuted) {
            texture.globject = renderer.CreateTexture(renderer.TEXTYPE.T2D, 512, 2, renderer.TEXFMT.C1I8, renderer.FILTER.LINEAR, renderer.TEXWRP.CLAMP, null);
            var num = 512;
            texture.audio.mSound.mFreqData = new Uint8Array(num);
            texture.audio.mSound.mWaveData = new Uint8Array(num);
            texture.loaded = true;
        }

        texture.audio.addEventListener("canplay", function () {
            if (texture == null || texture.audio == null) return;
            if (this.mForceMuted) return;
            if (texture.loaded === true) return;

            texture.globject = renderer.CreateTexture(renderer.TEXTYPE.T2D, 512, 2, renderer.TEXFMT.C1I8, renderer.FILTER.LINEAR, renderer.TEXWRP.CLAMP, null)

            texture.audio.mSound.mSource = wa.createMediaElementSource(texture.audio);
            texture.audio.mSound.mAnalyser = wa.createAnalyser();
            texture.audio.mSound.mGain = wa.createGain();

            texture.audio.mSound.mSource.connect(texture.audio.mSound.mAnalyser);
            texture.audio.mSound.mAnalyser.connect(texture.audio.mSound.mGain);
            //texture.audio.mSound.mGain.connect( wa.destination );
            texture.audio.mSound.mGain.connect(me.mGainNode);

            texture.audio.mSound.mFreqData = new Uint8Array(texture.audio.mSound.mAnalyser.frequencyBinCount);
            texture.audio.mSound.mWaveData = new Uint8Array(texture.audio.mSound.mAnalyser.frequencyBinCount);

            if (texture.audio.mPaused) {
                texture.audio.pause();
            } else {
                texture.audio.play().then(function () {
                    /*console.log("ok");*/
                }).catch(function (e) {
                    console.log("error " + e);
                });
            }
            texture.loaded = true;
        });

        texture.audio.addEventListener("error", function (e) {
            if (this.mForceMuted) return;

            if (texture.audio.hasFalled == true) {
                /*alert("Error: cannot load music" ); */
                return;
            }
            var str = texture.audio.src;
            str = str.substr(0, str.lastIndexOf('.')) + ".ogg";
            texture.audio.src = str;
            texture.audio.hasFalled = true;
        });

        if (!texture.audio.mForceMuted) {
            if (url.mType == "musicstream") {
                SC.resolve(url.mSrc).then(function (song) {
                    if (song.streamable == true) {
                        texture.audio.crossOrigin = '';
                        texture.audio.src = song.stream_url + "?client_id=" + SC.client_id;
                        texture.audio.soundcloudInfo = song;
                    } else {
                        alert('Shadertoy: Soundcloud - This track cannot be streamed');
                    }
                }).catch(
                    function (error) {
                        //console.log('Shadertoy: Soundcloud - ' + error.message);
                        if (me.mTextureCallbackFun != null) {
                            me.mTextureCallbackFun(me.mTextureCallbackObj, slot, {
                                wave: null
                            }, false, 4, 0, -1.0, me.mID);
                        }
                    });
            } else {
                texture.audio.src = url.mSrc;
            }
        }

        if (me.mTextureCallbackFun != null) {
            if (url.mType == "music") me.mTextureCallbackFun(me.mTextureCallbackObj, slot, {
                wave: null
            }, false, 4, 0, -1.0, me.mID);
            else if (url.mType == "musicstream") me.mTextureCallbackFun(me.mTextureCallbackObj, slot, {
                wave: null,
                info: texture.audio.soundcloudInfo
            }, false, 8, 0, -1.0, me.mID);
        }

        var returnValue = {
            mFailed: false,
            mNeedsShaderCompile: (this.mInputs[slot] == null) || (
                (this.mInputs[slot].mInfo.mType != "texture") &&
                (this.mInputs[slot].mInfo.mType != "webcam") &&
                (this.mInputs[slot].mInfo.mType != "mic") &&
                (this.mInputs[slot].mInfo.mType != "music") &&
                (this.mInputs[slot].mInfo.mType != "musicstream") &&
                (this.mInputs[slot].mInfo.mType != "keyboard") &&
                (this.mInputs[slot].mInfo.mType != "video"))
        };
        this.DestroyInput(slot);
        this.mInputs[slot] = texture;
        this.MakeHeader();
        return returnValue;
    } else if (url.mType == "keyboard") {
        texture = {};
        texture.mInfo = url;
        texture.globject = null;
        texture.loaded = true;

        texture.keyboard = {};

        if (me.mTextureCallbackFun != null)
            me.mTextureCallbackFun(me.mTextureCallbackObj, slot, {
                mImage: keyboard.mIcon,
                mData: keyboard.mData
            }, false, 6, 1, -1.0, me.mID);

        var returnValue = {
            mFailed: false,
            mNeedsShaderCompile: (this.mInputs[slot] == null) || (
                (this.mInputs[slot].mInfo.mType != "texture") &&
                (this.mInputs[slot].mInfo.mType != "webcam") &&
                (this.mInputs[slot].mInfo.mType != "mic") &&
                (this.mInputs[slot].mInfo.mType != "music") &&
                (this.mInputs[slot].mInfo.mType != "musicstream") &&
                (this.mInputs[slot].mInfo.mType != "keyboard") &&
                (this.mInputs[slot].mInfo.mType != "video"))
        };
        this.DestroyInput(slot);
        this.mInputs[slot] = texture;
        this.MakeHeader();
        return returnValue;
    } else if (url.mType == "buffer") {
        texture = {};
        texture.mInfo = url;

        texture.image = new Image();
        texture.image.onload = function () {
            if (me.mTextureCallbackFun != null)
                me.mTextureCallbackFun(me.mTextureCallbackObj, slot, {
                    texture: texture.image,
                    data: null
                }, true, 9, 1, -1.0, me.mID);
        }
        texture.image.src = url.mSrc;
        texture.id = assetID_to_bufferID(url.mID);
        texture.loaded = true;

        var returnValue = {
            mFailed: false,
            mNeedsShaderCompile: (this.mInputs[slot] == null) || (
                (this.mInputs[slot].mInfo.mType != "texture") &&
                (this.mInputs[slot].mInfo.mType != "webcam") &&
                (this.mInputs[slot].mInfo.mType != "mic") &&
                (this.mInputs[slot].mInfo.mType != "music") &&
                (this.mInputs[slot].mInfo.mType != "musicstream") &&
                (this.mInputs[slot].mInfo.mType != "keyboard") &&
                (this.mInputs[slot].mInfo.mType != "video"))
        };

        this.DestroyInput(slot);
        this.mInputs[slot] = texture;

        this.mEffect.ResizeBuffer(texture.id, this.mEffect.mXres, this.mEffect.mYres, false);

        // Setting the passes samplers
        this.SetSamplerFilter(slot, url.mSampler.filter, buffers, cubeBuffers, true);
        this.SetSamplerVFlip(slot, url.mSampler.vflip);
        this.SetSamplerWrap(slot, url.mSampler.wrap, buffers);

        this.MakeHeader();
        return returnValue;
    } else {
        alert("input type error");
        return {
            mFailed: true
        };
    }

    return {
        mFailed: true
    };

}