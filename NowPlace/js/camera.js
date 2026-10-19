let stream = null;

export function stopCamera(video) {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
  if (video) {
    video.pause();
    video.srcObject = null;
  }
}

function cameraError(error) {
  if (['NotAllowedError', 'PermissionDeniedError', 'SecurityError'].includes(error.name)) {
    return new Error('Acesso à câmera negado. No navegador, abra as permissões do site e selecione Permitir para Câmera.');
  }
  if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
    return new Error('Nenhuma câmera foi encontrada. Conecte uma webcam ou teste no celular.');
  }
  if (['NotReadableError','TrackStartError'].includes(error.name)) {
    return new Error('A câmera está ocupada ou inacessível. Feche Teams, Meet ou outros aplicativos e tente novamente.');
  }
  return new Error('Falha ao abrir a câmera: ' + (error.message || error.name));
}

export async function startCamera(video, facingMode = 'environment') {
  stopCamera(video);
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('Abra pelo Live Server em http://127.0.0.1:5500 ou HTTPS. O arquivo file:/// não permite usar a câmera aqui.');
  }

  // Ideal em vez de exact: funciona em notebooks com somente uma webcam.
  // Se o navegador rejeitar a preferência, tenta uma câmera qualquer.
  let source;
  try {
    source = await navigator.mediaDevices.getUserMedia({audio: false, video: {facingMode: {ideal: facingMode}}});
  } catch (firstError) {
    if (['NotAllowedError','PermissionDeniedError','SecurityError'].includes(firstError.name)) {
      throw cameraError(firstError);
    }
    try {
      source = await navigator.mediaDevices.getUserMedia({audio: false, video: true});
    } catch (fallbackError) {
      throw cameraError(fallbackError);
    }
  }
  stream = source;
  video.srcObject = stream;
  try {
    await video.play();
  } catch (error) {
    stopCamera(video);
    throw new Error('O navegador abriu a câmera, mas não exibiu o vídeo: ' + error.message);
  }
}

export function capturePhoto(video, canvas) {
  if (!stream || !video.videoWidth) throw new Error('Espere a imagem da câmera aparecer antes de capturar.');
  const scale = Math.min(1, 1200 / video.videoWidth);
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.72);
}
