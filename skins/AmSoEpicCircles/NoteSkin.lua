--Unlimited Stepman Works Noteskin.lua for SM 5.0.12

--I am the bone of my noteskin
--Arrows are my body, and explosions are my blood
--I have created over a thousand noteskins
--Unknown to death
--Nor known to life
--Have withstood pain to create many noteskins
--Yet these hands will never hold anything
--So as I pray, Unlimited Stepman Works

local function CreateLift()
    return Def.ActorFrame {LoadActor('Misc/Lift') .. {}}
end

local function createMines()
    local t =
        Def.ActorFrame {
        Def.Sprite {
            Texture = 'Misc/Mine',
            Frames = Sprite.LinearFrames(8, 1)
        }
    }
    return t
end

local function createReceptor(direction)
    local actor =
        Def.ActorFrame {
        Def.Sprite {
            Texture = NOTESKIN:GetPath('Receptors/_' .. direction, 'Go Receptor'),
            InitCommand = function(self)
                self:effectclock('beat')
            end,
            PressCommand = function(self)
                self:visible(false)
            end,
            LiftCommand = function(self)
                self:visible(true)
            end,
			NoneCommand = NOTESKIN:GetMetricA('ReceptorArrow', 'NoneCommand'),
            W5Command = NOTESKIN:GetMetricA('ReceptorArrow', 'W5Command'),
            W4Command = NOTESKIN:GetMetricA('ReceptorArrow', 'W4Command'),
            W3Command = NOTESKIN:GetMetricA('ReceptorArrow', 'W3Command'),
            W2Command = NOTESKIN:GetMetricA('ReceptorArrow', 'W2Command'),
            W1Command = NOTESKIN:GetMetricA('ReceptorArrow', 'W1Command')
        },
        Def.Sprite {
            Texture = NOTESKIN:GetPath('Receptors/_' .. direction, 'Press Receptor'),
            InitCommand = function(self)
                self:effectclock('beat')
                self:visible(false)
            end,
            PressCommand = function(self)
                self:visible(true)
            end,
            LiftCommand = function(self)
                self:visible(false)
            end,
			NoneCommand = NOTESKIN:GetMetricA('ReceptorArrow', 'NoneCommand'),
            W5Command = NOTESKIN:GetMetricA('ReceptorArrow', 'W5Command'),
            W4Command = NOTESKIN:GetMetricA('ReceptorArrow', 'W4Command'),
            W3Command = NOTESKIN:GetMetricA('ReceptorArrow', 'W3Command'),
            W2Command = NOTESKIN:GetMetricA('ReceptorArrow', 'W2Command'),
            W1Command = NOTESKIN:GetMetricA('ReceptorArrow', 'W1Command')
        }
    }

    if direction == "Right" or direction == "Left" then

		local sidebarsEnabled = NOTESKIN:GetMetric("NoteskinPreferences","SideBars") == "on"

		if sidebarsEnabled then

		actor[#actor + 1] = LoadActor(NOTESKIN:GetPath("Side/_Side", direction)) ..{
			InitCommand = function(self)

				self:zoom(0.23)
				self:zoomy(2)

				if direction == "Right" then
					self:x(self:GetX() + 33)
				else
					self:x(self:GetX() - 33)
				end


			end
		}

		end
    end

    return actor
end

local function createNote(direction)
    local t =
        Def.Sprite {
        Name = 'Note',
        Texture = NOTESKIN:GetPath('Notes/_' .. direction, 'Tap Note')
    }

    return t
end

local function createHead(direction)
    local t =
        Def.Sprite {
        Name = 'Head',
        Texture = NOTESKIN:GetPath('HoldHead/_' .. direction, 'Tap Note')
    }

    return t
end

local USWN = {}

--Defining on which direction the other directions should be bassed on
--This will let us use less files which is quite handy to keep the noteskin directory nice
--Do remember this will Redirect all the files of that Direction to the Direction its pointed to
--If you only want some files to be redirected take a look at the "custom hold/roll per direction"
USWN.ButtonRedir = {
    Up = 'Up',
    Down = 'Up',
    Left = 'Up',
    Right = 'Up'
}

-- Defined the parts to be rotated at which degree
USWN.Rotate = {
    Up = 0,
    Down = 0,
    Left = 0,
    Right = 0
}

--Define elements that need to be redirected
USWN.ElementRedir = {
    ['Tap Fake'] = 'Tap Note',
    ['Roll Explosion'] = 'Hold Explosion',
    ['Hold Body Inactive'] = 'Hold Body Active',
    ['Hold Bottomcap Inactive'] = 'Hold Bottomcap Active',
    ['Roll Body Inactive'] = 'Roll Body Active',
    ['Roll Bottomcap Inactive'] = 'Roll Bottomcap Active'
}

-- Parts of noteskins which we want to rotate
USWN.PartsToRotate = {
    ['Receptor'] = true,
    ['Tap Note'] = true,
    ['Tap Fake'] = true,
    ['Tap Addition'] = true,
    ['Hold Explosion'] = true,
    ['Hold Head Active'] = true,
    ['Hold Head Inactive'] = true,
    ['Roll Explosion'] = true,
    ['Roll Head Active'] = true,
    ['Roll Head Inactive'] = true
}

-- Parts that should be Redirected to _Blank.png
-- you can add/remove stuff if you want
USWN.Blank = {
    ['Tap Explosion Bright'] = true,
    ['Tap Explosion Dim'] = true,
    ['Hold Topcap Active'] = true,
    ['Hold Topcap Inactive'] = true,
    ['Roll Topcap Active'] = true,
    ['Roll Topcap Inactive'] = true,
    ['Hold Tail Active'] = true,
    ['Hold Tail Inactive'] = true,
    ['Roll Tail Active'] = true,
    ['Roll Tail Inactive'] = true
}

-- <
--Between here we usally put all the commands the noteskin.lua needs to do, some are extern in other files
--If you need help with lua go to http://dguzek.github.io/Lua-For-SM5/API/Lua.xml there are a bunch of codes there
--Also check out common it has a load of lua codes in files there
--Just play a bit with lua its not that hard if you understand coding
--But SM can be an ass in some cases, and some codes jut wont work if you dont have the noteskin on FallbackNoteSkin=common in the metric.ini

function USWN.Load()
    local sButton = Var 'Button'
    local sElement = Var 'Element'

    local Button = USWN.ButtonRedir[sButton] or sButton

    --Setting global element
    local Element = USWN.ElementRedir[sElement] or sElement

    if string.find(sElement, 'Head') then
        Element = 'Hold Head'
    end

    --Returning first part of the code, The redirects, Second part is for commands

    local t = nil

    if Element == 'Tap Lift' then
        t = CreateLift()
    elseif Element == 'Tap Mine' then
        t = createMines()
    elseif Element == 'Receptor' then
        t = createReceptor(sButton)
    elseif Element == 'Tap Note' then
        t = createNote(sButton)
    elseif Element == 'Hold Head' then
        t = createHead(sButton)
    else
        if string.find(Element, 'Hold') or string.find(Element, 'Roll') then
            Button = 'Holds/' .. Button
        end

        t = LoadActor(NOTESKIN:GetPath(Button, Element))
    end

    --Set blank redirects
    if USWN.Blank[sElement] then
        t = Def.Actor {}
        --Check if element is sprite only
        if Var 'SpriteOnly' then
            t = LoadActor(NOTESKIN:GetPath('', '_blank'))
        end
    end

    if USWN.PartsToRotate[sElement] then
        t.BaseRotationZ = USWN.Rotate[sButton] or nil
    end

    --Explosion should not be rotated, It calls other actors
    if sElement == 'Explosion' then
        t.BaseRotationZ = nil
    end

    return t
end
-- >

-- dont forget to return cuz else it wont work ;>
return USWN
