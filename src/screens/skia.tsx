import { useEffect, useCallback, useState, useRef } from 'react'
import { FAL_CREDENTIALS } from '../../credentials';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  Image,
  View,
  TouchableHighlight,
  Dimensions
} from 'react-native'
import {
  Canvas,
  Path,
  SkPath,
  Skia,
  TouchInfo,
  useTouchHandler,
  ImageFormat,
  Fill,
} from '@shopify/react-native-skia'
import * as fal from '@fal-ai/serverless-client'

const seed = Math.floor(Math.random() * 100000)
const APP_ID = '110602490-sdxl-turbo-realtime'
const DEFAULT_PROMPT = 'masterpice, best quality, An in focus, cinematic shot of a bright bluebird sitting on a tree branch.'
const { width } = Dimensions.get('window')
const canvasSize = width - 125

type LcmInput = {
  prompt: string
  image_url: string
  seed?: number
  num_inference_steps?: number
  guidance_scale?: number
  strength?: number
  sync_mode?: boolean
}

type LcmImage = {
  url: string
  width: number
  height: number
}

type LcmOutput = {
  images: LcmImage[]
  seed: number
}

fal.config({
  credentials: FAL_CREDENTIALS
})

type PathWithColorAndWidth = {
  path: SkPath
  color: Color
  strokeWidth: number
}

export function DrawingCanvas() {
  const [paths, setPaths] = useState<PathWithColorAndWidth[]>([])
  const [color, setColor] = useState<Color>(Colors[0])
  const canvasRef = useRef<any>(null)
  const [strokeWidth, setStrokeWidth] = useState(strokes[6])
  const [image, setImage] = useState<any>(null)
  const [prompt, setPrompt] = useState<string>(DEFAULT_PROMPT)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (isDragging && canvas) {
      const intervalTimeout = setInterval(() => {
        sendCanvasSnapshot()
      }, 8)

      return () => clearInterval(intervalTimeout);
    }
  }, [isDragging]);

  const { send } = fal.realtime.connect<LcmInput, LcmOutput>(APP_ID, {
    onError(error) {
      console.log('error:', error)
    },
    onResult(result) {
      const imageUrl = result.images[0].url
      setImage(imageUrl)
    }
  })

  const onDrawingStart = useCallback(
    (touchInfo: TouchInfo) => {
      setPaths((currentPaths) => {
        const { x, y } = touchInfo
        const newPath = Skia.Path.Make()
        newPath.moveTo(x, y)
        return [
          ...currentPaths,
          {
            path: newPath,
            color,
            strokeWidth,
          },
        ]
      })
    },
    [color, strokeWidth]
  )

  const sendCanvasSnapshot = () => {
    const canvas = canvasRef.current
    console.log('canvas:', canvas)
    if (!canvas) {
      return
    }
    const image = canvas.makeImageSnapshot({
      x: 0,
      y: 0,
      width: canvasSize,
      height: canvasSize,
    })
    const imageUrl = `data:image/jpeg;base64,${image.encodeToBase64(
      ImageFormat.PNG,
    )}`

    send({
      prompt: prompt,
      image_url: imageUrl,
      sync_mode: true,
      seed,
    })
  }

  const onDrawingActive = useCallback((touchInfo: TouchInfo) => {
    setPaths((currentPaths) => {
      const { x, y } = touchInfo
      const currentPath = currentPaths[currentPaths.length - 1]
      const lastPoint = currentPath.path.getLastPt()
      const xMid = (lastPoint.x + x) / 2
      const yMid = (lastPoint.y + y) / 2

      currentPath.path.quadTo(lastPoint.x, lastPoint.y, xMid, yMid)
      return [...currentPaths.slice(0, currentPaths.length - 1), currentPath]
    })
  }, [])

  const touchHandler = useTouchHandler(
    {
      onActive: onDrawingActive,
      onStart: onDrawingStart,
    },
    [onDrawingActive, onDrawingStart]
  )

  function reset() {
    setPaths([])
    sendCanvasSnapshot()
  }

  return (
    <View style={{
      flex: 1, alignItems: 'center', marginTop: 5
    }}>
      <Toolbar
        color={color}
        strokeWidth={strokeWidth}
        setColor={setColor}
        setStrokeWidth={setStrokeWidth}
      />
      <Canvas
      onTouchStart={() => {
        setIsDragging(true)
      }}
       ref={canvasRef}
        onTouchEnd={() => {
          setIsDragging(false);
        }}
        style={{
          width: canvasSize,
          height: canvasSize,
          marginTop: 5,
        }}
        onTouch={touchHandler}>
          <Fill color={'#1e1e1e'} />
          {paths.map((path, index) => (
            <Path
              key={index}
              path={path.path}
              color={path.color}
              style={'stroke'}
              strokeWidth={path.strokeWidth}
            />
          ))}
      </Canvas>
      <TouchableHighlight
      underlayColor={'transparent'}
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        width: canvasSize,
        paddingVertical: 10
      }}
      onPress={() => {
        reset()
      }}>
        <Text>Clear Canvas</Text>
      </TouchableHighlight>
        <Image
          src={image}
          style={{ width: canvasSize, height: canvasSize, marginTop: -1 }}
        />
      <TextInput
        placeholder='prompt'
        onChangeText={v => setPrompt(v)}
        value={prompt}
        style={{
          paddingHorizontal: 10,
          width,
          height: 40,
          backgroundColor: 'rgba(0, 0, 0, .05)' }}
      />
    </View>
  )
}

const Colors = ['black', 'red', 'blue', 'green', 'yellow', 'brown'] as const

type Color = (typeof Colors)[number]

type ToolbarProps = {
  color: Color
  strokeWidth: number
  setColor: (color: Color) => void
  setStrokeWidth: (strokeWidth: number) => void
}

const strokes = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]

const Toolbar = ({
  color,
  strokeWidth,
  setColor,
  setStrokeWidth,
}: ToolbarProps) => {
  const [showStrokes, setShowStrokes] = useState(false)

  const handleStrokeWidthChange = (stroke: number) => {
    setStrokeWidth(stroke)
    setShowStrokes(false)
  }

  const handleChangeColor = (color: Color) => {
    setColor(color)
  }

  return (
    <>
      {showStrokes && (
        <View style={[style.toolbar, style.strokeToolbar]}>
          {strokes.map((stroke) => (
            <Pressable
              onPress={() => handleStrokeWidthChange(stroke)}
              key={stroke}
            >
              <Text style={style.strokeOption}>{stroke}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <View style={[style.toolbar]}>
        <Pressable
          style={style.currentStroke}
          onPress={() => setShowStrokes(!showStrokes)}
        >
          <Text>{strokeWidth}</Text>
        </Pressable>
        <View style={style.separator} />
        {Colors.map((item) => (
          <ColorButton
            isSelected={item === color}
            key={item}
            color={item}
            onPress={() => handleChangeColor(item)}
          />
        ))}
      </View>
    </>
  )
}

type ColorButtonProps = {
  color: Color
  isSelected: boolean
  onPress: () => void
}

const ColorButton = ({ color, onPress, isSelected }: ColorButtonProps) => {
  return (
    <Pressable
      onPress={onPress}
      style={[
        style.colorButton,
        { backgroundColor: color },
        isSelected && {
          borderWidth: 2,
          borderColor: 'black',
        },
      ]}
    />
  )
}

const style = StyleSheet.create({
  strokeOption: {
    fontSize: 15,
    backgroundColor: '#f7f7f7',
  },
  toolbar: {
    backgroundColor: '#ffffff',
    height: 50,
    width: 300,
    borderRadius: 100,
    borderColor: '#f0f0f0',
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  separator: {
    height: 30,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginHorizontal: 10,
  },
  currentStroke: {
    backgroundColor: '#f7f7f7',
    borderRadius: 5,
  },
  strokeToolbar: {
    position: 'absolute',
    top: 70,
    justifyContent: 'space-between',
    zIndex: 100,
  },
  colorButton: {
    width: 30,
    height: 30,
    borderRadius: 100,
    marginHorizontal: 5,
  },
})
