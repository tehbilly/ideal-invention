:: TODO Point to actual version of node we want to use

@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\cli.js" %*
) ELSE (
  @SETLOCAL
  @SET PATHEXT=%PATHEXT:;.JS;=;%
  node  "%~dp0\cli.js" %*
)