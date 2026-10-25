/**
 * Kawarp - Fluid Animated Background Renderer
 *
 * Creates a fluid, animated background effect similar to Apple Music's album art visualization.
 * Uses WebGL with Kawase blur and domain warping techniques.
 *
 * Optimized architecture:
 * - Blur runs on small textures (128x128) only when image changes
 * - Smooth crossfade transitions between images
 * - Instant first frame without black buffer crossfade
 * - High-precision FBO tracking and resolution management
 * - Robust CORS and blob/imageBitmap loading
 */
export interface KawarpOptions {
    warpIntensity?: number;
    blurPasses?: number;
    animationSpeed?: number;
    transitionDuration?: number;
    saturation?: number;
    tintColor?: [number, number, number];
    tintIntensity?: number;
    dithering?: number;
    scale?: number;
}
export interface KawarpContextOptions {
    /** Use WebGL2 with float32 color history for smoothed video. Creation only. */
    highPrecisionInput?: boolean;
    /** Request a float16 WebGL2 drawing buffer, falling back to RGBA8. Creation only. */
    highPrecisionOutput?: boolean;
}
export interface KawarpVideoOptions {
    /** Width of the sampled color map (default: 128) */
    sampleWidth?: number;
    /** Height of the sampled color map (default: 72) */
    sampleHeight?: number;
    /** Largest reduction per downsampling stage (default: 2) */
    downsampleFactor?: number;
    /** Maximum frames sampled per second, 0 follows the video (default: 0) */
    frameRate?: number;
    /** Temporal color smoothing response in ms, 0 disables it (default: 0) */
    smoothing?: number;
    /** Called when a frame cannot be imported; the video is unloaded first */
    onError?: (error: unknown) => void;
}
export declare class Kawarp {
    private canvas;
    private gl;
    private halfFloatExt;
    private halfFloatLinearExt;
    private blurProgram;
    private blendProgram;
    private tintProgram;
    private warpProgram;
    private outputProgram;
    private positionBuffer;
    private texCoordBuffer;
    private sourceTexture;
    private blurFBO1;
    private blurFBO2;
    private currentAlbumFBO;
    private nextAlbumFBO;
    private warpFBO;
    private animationId;
    private lastFrameTime;
    private accumulatedTime;
    private isPlaying;
    private disposed;
    private isTransitioning;
    private transitionStartTime;
    private _transitionDuration;
    private _warpIntensity;
    private _blurPasses;
    private _animationSpeed;
    private _targetAnimationSpeed;
    private _saturation;
    private _tintColor;
    private _tintIntensity;
    private _dithering;
    private _scale;
    private hasImage;
    private gl2;
    private halfFloatRenderTargets;
    private float32RenderTargets;
    private floatLinearFiltering;
    private _highPrecisionOutput;
    private highPrecisionInputRequested;
    private activeSourceTexture;
    private imageSourceWidth;
    private imageSourceHeight;
    private videoFrameWidth;
    private videoFrameHeight;
    private video;
    private videoLoadCount;
    private shownVideoLoad;
    private videoOptions;
    private videoCallbackId;
    private videoUploadTexture;
    private videoStages;
    private videoHistory;
    private videoHistoryIndex;
    private hasVideoHistory;
    private videoSmoothingTarget;
    private videoSmoothingTargetAt;
    private videoSmoothedAt;
    private videoHistoryStep;
    private videoSampleSlot;
    private videoTargetsStale;
    private videoSourceWidth;
    private videoSourceHeight;
    private videoFrameTime;
    private videoMediaTime;
    private videoFrameShown;
    private videoFramePending;
    private retainedVideoFrame;
    private samplingPrograms;
    private sampleTargets;
    private sampleTargetsLayout;
    private pendingSampleSize;
    private samplePixelBuffer;
    private pendingSample;
    private attribs;
    private uniforms;
    constructor(canvas: HTMLCanvasElement, options?: KawarpOptions & KawarpContextOptions);
    /** Whether the drawing buffer is float16 (requested via highPrecisionOutput) */
    get highPrecisionOutput(): boolean;
    /** Whether smoothed video keeps float32 color history (requested via highPrecisionInput) */
    get highPrecisionInput(): boolean;
    get warpIntensity(): number;
    set warpIntensity(value: number);
    get blurPasses(): number;
    set blurPasses(value: number);
    get animationSpeed(): number;
    set animationSpeed(value: number);
    get transitionDuration(): number;
    set transitionDuration(value: number);
    get saturation(): number;
    set saturation(value: number);
    get tintColor(): [number, number, number];
    set tintColor(value: [number, number, number]);
    get tintIntensity(): number;
    set tintIntensity(value: number);
    get dithering(): number;
    set dithering(value: number);
    get scale(): number;
    set scale(value: number);
    setOptions(options: Partial<KawarpOptions>): void;
    getOptions(): Required<KawarpOptions>;
    loadImage(src: string): Promise<void>;
    loadImageElement(source: TexImageSource): void;
    private showImageElement;
    loadImageData(data: Uint8Array | Uint8ClampedArray, width: number, height: number): void;
    loadFromImageData(imageData: ImageData): void;
    loadBlob(blob: Blob): Promise<void>;
    loadBase64(base64: string): Promise<void>;
    loadArrayBuffer(buffer: ArrayBuffer, mimeType?: string): Promise<void>;
    loadGradient(colors: string[], angle?: number): void;
    /**
     * Use a playing video as the source. Each decoded frame is imported on the
     * GPU, downsampled in stages, optionally smoothed over time, and blurred in
     * place. The first frame crossfades from the current image (instantly on a
     * stopped instance). Video renders
     * upright; images keep their historical flipped orientation.
     *
     * Calling again with the same element only updates the options. A stopped
     * instance skips frames from a playing video and draws single frames from a
     * paused one, so seeking while paused stays visible.
     */
    loadVideo(video: HTMLVideoElement, options?: KawarpVideoOptions): void;
    /**
     * Stop following the video. The last frame stays on screen until the next
     * image or video is loaded.
     */
    unloadVideo(): void;
    /**
     * Read a small RGBA8 thumbnail (size x size, bottom row of the rendered
     * orientation first) of the current source, e.g. to measure brightness. WebGL2 reads asynchronously
     * through a pixel buffer and fence; WebGL1 reads synchronously.
     * Resolves to null when there is no source or the instance is disposed.
     */
    sampleSource(size?: number): Promise<Uint8Array | null>;
    /**
     * Halving stages from the source down to size x size. A single 4-tap
     * reduction from full-resolution artwork would skip most texels and alias.
     */
    private prepareSampleTargets;
    private createByteFramebuffer;
    private requestVideoFrame;
    private handleVideoFrame;
    private resumeVideoCallbacks;
    private processVideoFrame;
    private advanceVideoSmoothing;
    private showVideoFrame;
    private prepareVideoTargets;
    /**
     * Free video render targets. The one the blur currently reads from is
     * retained so re-blurring keeps working until another source replaces it.
     */
    private releaseVideoTargets;
    private releaseRetainedVideoFrame;
    private getSamplingPrograms;
    private drawDownsample;
    private drawSmoothing;
    /**
     * Process a new image: blur it and start transition
     * This is the key optimization - blur only runs here, not every frame!
     */
    private processNewImage;
    /**
     * Re-blur the current image (used when blurPasses changes)
     * Updates nextAlbumFBO in place without starting a transition
     */
    private reblurCurrentImage;
    /**
     * Blur the source texture into the target FBO (with tint applied before blur)
     */
    private blurSourceInto;
    resize(): void;
    start(): void;
    stop(): void;
    renderFrame(time?: number): void;
    dispose(): void;
    private renderLoop;
    /**
     * Main render loop - very efficient!
     * Just: blend album FBOs → domain warp → output
     */
    private render;
    private setupAttributes;
    private createShader;
    private createProgram;
    private createBuffer;
    private createTexture;
    private createFramebuffer;
    /**
     * WebGL2 render target with an explicit internal format. Float formats fall
     * back to RGBA8 when the driver reports them incomplete.
     */
    private createSizedFramebuffer;
    private applyFloatDrawingBuffer;
    private deleteFramebuffer;
}
export default Kawarp;
