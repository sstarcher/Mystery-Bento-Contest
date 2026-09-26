# ====================================================================
# SUSHI CONVEYOR - DIRECT STL GENERATOR FOR PRUSA CORE ONE+
# Generates ready-to-print binary STL files directly
# ====================================================================

param (
    [string]$OutputDir = $PSScriptRoot
)

function Write-BinaryStl {
    param (
        [string]$FilePath,
        [System.Collections.Generic.List[PSObject]]$Facets
    )

    $fs = [System.IO.File]::Create($FilePath)
    $bw = New-Object System.IO.BinaryWriter($fs)

    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes("Sushi Conveyor - Generated for Prusa Core One+")
    $headerPadded = New-Object byte[] 80
    [Array]::Copy($headerBytes, $headerPadded, [Math]::Min($headerBytes.Length, 80))
    $bw.Write($headerPadded)

    $bw.Write([uint32]$Facets.Count)

    foreach ($f in $Facets) {
        $bw.Write([float]$f.Normal[0]); $bw.Write([float]$f.Normal[1]); $bw.Write([float]$f.Normal[2])
        $bw.Write([float]$f.V1[0]); $bw.Write([float]$f.V1[1]); $bw.Write([float]$f.V1[2])
        $bw.Write([float]$f.V2[0]); $bw.Write([float]$f.V2[1]); $bw.Write([float]$f.V2[2])
        $bw.Write([float]$f.V3[0]); $bw.Write([float]$f.V3[1]); $bw.Write([float]$f.V3[2])
        $bw.Write([uint16]0)
    }

    $bw.Close()
    $fs.Close()
    Write-Host "Exported: $FilePath with $($Facets.Count) triangles."
}

function Add-Quad {
    param ($Facets, $v1, $v2, $v3, $v4, $normal = @(0,0,0))
    $Facets.Add([PSCustomObject]@{ Normal = $normal; V1 = $v1; V2 = $v2; V3 = $v3 })
    $Facets.Add([PSCustomObject]@{ Normal = $normal; V1 = $v1; V2 = $v3; V3 = $v4 })
}

# -------------------------------------------------------------
# 1. GENERATE CRESCENT SLAT STL
# -------------------------------------------------------------
function Generate-CrescentSlatStl {
    param ([string]$Path)

    $slatW = 100.0
    $pitch = 38.0
    $rLead = 42.0
    $rTrail = 42.45
    $hDeck = 4.0
    $steps = 48

    $facets = New-Object 'System.Collections.Generic.List[PSObject]'

    $frontPts = @()
    $rearPts = @()

    for ($i = 0; $i -le $steps; $i++) {
        $x = -$slatW/2 + ($slatW * $i / $steps)
        $yFront = 0.0
        if ([Math]::Abs($x) -le $rLead) {
            $yFront = [Math]::Sqrt([Math]::Max(0.0, $rLead*$rLead - $x*$x))
        }

        $yRear = -$pitch
        if ([Math]::Abs($x) -le $rTrail) {
            $yRear = -$pitch + [Math]::Sqrt([Math]::Max(0.0, $rTrail*$rTrail - $x*$x))
        }

        $frontPts += ,@($x, $yFront)
        $rearPts += ,@($x, $yRear)
    }

    for ($i = 0; $i -lt $steps; $i++) {
        $f1 = $frontPts[$i]; $f2 = $frontPts[$i+1]
        $r1 = $rearPts[$i]; $r2 = $rearPts[$i+1]

        # Bottom face
        Add-Quad $facets @($f1[0], $f1[1], 0) @($r1[0], $r1[1], 0) @($r2[0], $r2[1], 0) @($f2[0], $f2[1], 0)
        # Top face
        Add-Quad $facets @($f1[0], $f1[1], $hDeck) @($f2[0], $f2[1], $hDeck) @($r2[0], $r2[1], $hDeck) @($r1[0], $r1[1], $hDeck)
        # Front edge
        Add-Quad $facets @($f1[0], $f1[1], 0) @($f2[0], $f2[1], 0) @($f2[0], $f2[1], $hDeck) @($f1[0], $f1[1], $hDeck)
        # Rear edge
        Add-Quad $facets @($r1[0], $r1[1], 0) @($r1[0], $r1[1], $hDeck) @($r2[0], $r2[1], $hDeck) @($r2[0], $r2[1], 0)
    }

    $fLeft = $frontPts[0]; $rLeft = $rearPts[0]
    Add-Quad $facets @($fLeft[0], $fLeft[1], 0) @($fLeft[0], $fLeft[1], $hDeck) @($rLeft[0], $rLeft[1], $hDeck) @($rLeft[0], $rLeft[1], 0)

    $fRight = $frontPts[$steps]; $rRight = $rearPts[$steps]
    Add-Quad $facets @($fRight[0], $fRight[1], 0) @($rRight[0], $rRight[1], 0) @($rRight[0], $rRight[1], $hDeck) @($fRight[0], $fRight[1], $hDeck)

    # Central Hinge Boss Underneath (Front male knuckle)
    $rHinge = 6.0
    $zStart = -7.0
    $zEnd = 0.0
    $hSteps = 24
    for ($i = 0; $i -lt $hSteps; $i++) {
        $a1 = 2 * [Math]::PI * $i / $hSteps
        $a2 = 2 * [Math]::PI * ($i + 1) / $hSteps
        $x1 = $rHinge * [Math]::Cos($a1); $y1 = $rHinge * [Math]::Sin($a1)
        $x2 = $rHinge * [Math]::Cos($a2); $y2 = $rHinge * [Math]::Sin($a2)
        Add-Quad $facets @($x1, $y1, $zStart) @($x2, $y2, $zStart) @($x2, $y2, $zEnd) @($x1, $y1, $zEnd)
        $facets.Add([PSCustomObject]@{ Normal = @(0,0,-1); V1 = @(0,0,$zStart); V2 = @($x2,$y2,$zStart); V3 = @($x1,$y1,$zStart) })
    }

    Write-BinaryStl -FilePath $Path -Facets $facets
}

# -------------------------------------------------------------
# 2. GENERATE DRIVE SPROCKET STL
# -------------------------------------------------------------
function Generate-DriveSprocketStl {
    param ([string]$Path)

    $numTeeth = 10
    $pitch = 38.0
    $pitchR = ($numTeeth * $pitch) / (2 * [Math]::PI) # 60.48 mm
    $outerR = $pitchR + 6.0
    $thick = 10.0
    $pocketR = 6.5
    $hubR = 14.0
    $hubH = 18.0
    $shaftR = 2.6
    $steps = 72

    $facets = New-Object 'System.Collections.Generic.List[PSObject]'

    # Disc perimeter
    for ($i = 0; $i -lt $steps; $i++) {
        $a1 = 2 * [Math]::PI * $i / $steps
        $a2 = 2 * [Math]::PI * ($i + 1) / $steps
        $x1 = $outerR * [Math]::Cos($a1); $y1 = $outerR * [Math]::Sin($a1)
        $x2 = $outerR * [Math]::Cos($a2); $y2 = $outerR * [Math]::Sin($a2)

        # Outer rim
        Add-Quad $facets @($x1, $y1, 0) @($x2, $y2, 0) @($x2, $y2, $thick) @($x1, $y1, $thick)

        # Bottom disc cap (outer ring to hub)
        $xh1 = $hubR * [Math]::Cos($a1); $yh1 = $hubR * [Math]::Sin($a1)
        $xh2 = $hubR * [Math]::Cos($a2); $yh2 = $hubR * [Math]::Sin($a2)
        Add-Quad $facets @($x1, $y1, 0) @($xh1, $yh1, 0) @($xh2, $yh2, 0) @($x2, $y2, 0)

        # Top disc cap
        Add-Quad $facets @($x1, $y1, $thick) @($x2, $y2, $thick) @($xh2, $yh2, $thick) @($xh1, $yh1, $thick)

        # Hub wall (from thick to hubH)
        Add-Quad $facets @($xh1, $yh1, $thick) @($xh2, $yh2, $thick) @($xh2, $yh2, $hubH) @($xh1, $yh1, $hubH)

        # Hub top face (to shaft bore)
        $xs1 = $shaftR * [Math]::Cos($a1); $ys1 = $shaftR * [Math]::Sin($a1)
        $xs2 = $shaftR * [Math]::Cos($a2); $ys2 = $shaftR * [Math]::Sin($a2)
        Add-Quad $facets @($xh1, $yh1, $hubH) @($xh2, $yh2, $hubH) @($xs2, $ys2, $hubH) @($xs1, $ys1, $hubH)

        # Shaft bore inner wall
        Add-Quad $facets @($xs1, $ys1, 0) @($xs2, $ys2, 0) @($xs2, $ys2, $hubH) @($xs1, $ys1, $hubH)
    }

    Write-BinaryStl -FilePath $Path -Facets $facets
}

$slatPath = Join-Path $OutputDir "crescent_slat.stl"
$sprocketPath = Join-Path $OutputDir "drive_sprocket.stl"

Generate-CrescentSlatStl -Path $slatPath
Generate-DriveSprocketStl -Path $sprocketPath
