Add-Type -AssemblyName System.Drawing

function Create-Favicon {
    param (
        [string]$outputPath,
        [int]$size = 512
    )

    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Transparent canvas
    $g.Clear([System.Drawing.Color]::Transparent)

    # 1. Background: Sahara Terracotta rounded squircle #c2652a
    $terraColor = [System.Drawing.ColorTranslator]::FromHtml("#c2652a")
    $creamColor = [System.Drawing.ColorTranslator]::FromHtml("#faf5ee")

    $brushBg = New-Object System.Drawing.SolidBrush($terraColor)
    $rect = New-Object System.Drawing.Rectangle(4, 4, ($size - 8), ($size - 8))
    $radius = [int]($size * 0.22) # smooth squircle corner
    
    # Draw rounded rectangle
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $diameter = $radius * 2
    $path.AddArc($rect.X, $rect.Y, $diameter, $diameter, 180, 90)
    $path.AddArc($rect.Right - $diameter, $rect.Y, $diameter, $diameter, 270, 90)
    $path.AddArc($rect.Right - $diameter, $rect.Bottom - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc($rect.X, $rect.Bottom - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()

    $g.FillPath($brushBg, $path)

    # Subtle inner border for crisp depth
    $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(60, 255, 255, 255), [float]3.0)
    $g.DrawPath($borderPen, $path)

    # 2. Bold "O" Outer Ring
    $oWidth = [float]($size * 0.13)
    $oPen = New-Object System.Drawing.Pen($creamColor, $oWidth)
    
    $oX = [float]($size * 0.20)
    $oY = [float]($size * 0.20)
    $oSize = [float]($size * 0.60)
    $g.DrawEllipse($oPen, $oX, $oY, $oSize, $oSize)

    # 3. Dynamic 45-degree Auction Gavel / Outbid Spark at Center
    $centerX = [float]($size / 2.0)
    $centerY = [float]($size / 2.0)
    
    $g.TranslateTransform($centerX, $centerY)
    $g.RotateTransform(45)

    # Gavel Handle
    $handlePen = New-Object System.Drawing.Pen($creamColor, [float]($size * 0.08))
    $handlePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $handlePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($handlePen, 0, [float](-$size * 0.04), 0, [float]($size * 0.22))

    # Gavel Head
    $headBrush = New-Object System.Drawing.SolidBrush($creamColor)
    $headW = [float]($size * 0.26)
    $headH = [float]($size * 0.10)
    $headX = [float](-$headW / 2.0)
    $headY = [float](-$size * 0.13)
    
    # Rounded rectangle for gavel head
    $headPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $headRad = [float]($headH * 0.35)
    $headDiam = $headRad * 2
    $headRect = New-Object System.Drawing.RectangleF($headX, $headY, $headW, $headH)
    
    $headPath.AddArc($headRect.X, $headRect.Y, $headDiam, $headDiam, 180, 90)
    $headPath.AddArc($headRect.Right - $headDiam, $headRect.Y, $headDiam, $headDiam, 270, 90)
    $headPath.AddArc($headRect.Right - $headDiam, $headRect.Bottom - $headDiam, $headDiam, $headDiam, 0, 90)
    $headPath.AddArc($headRect.X, $headRect.Bottom - $headDiam, $headDiam, $headDiam, 90, 90)
    $headPath.CloseFigure()
    
    $g.FillPath($headBrush, $headPath)

    # Reset transform
    $g.ResetTransform()

    # Save output
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $borderPen.Dispose()
    $oPen.Dispose()
    $handlePen.Dispose()
    $headBrush.Dispose()
    $headPath.Dispose()
    $brushBg.Dispose()
    $path.Dispose()
    $g.Dispose()
    $bmp.Dispose()
    
    Write-Output "Generated: $outputPath (${size}x${size})"
}

# Generate high-resolution 512x512 icons for App Router
Create-Favicon -outputPath "d:\cspython\Bidout\app\icon.png" -size 512
Create-Favicon -outputPath "d:\cspython\Bidout\app\apple-icon.png" -size 512
Create-Favicon -outputPath "d:\cspython\Bidout\public\icon.png" -size 512
Create-Favicon -outputPath "d:\cspython\Bidout\public\apple-icon.png" -size 512
