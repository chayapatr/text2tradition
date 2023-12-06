import { Bone, SkinnedMesh, Vector3 } from 'three'

import { BoneKey } from '../bones'
import { CCDIKSolver, IK } from './ccd-ik'

declare global {
  interface Window {
    ikManager: IKManager
  }
}

interface ControlBones {
  leftArm: Bone
  rightArm: Bone
  leftHand: Bone
  rightHand: Bone
}

interface AxisBones {
  forehead: Bone
  neck: Bone
  body: Bone
}

export class IKManager {
  ik: CCDIKSolver
  mesh: SkinnedMesh
  axisBones: AxisBones
  controlBones: ControlBones

  constructor(mesh: SkinnedMesh) {
    this.mesh = mesh

    this.controlBones = {
      leftArm: this.boneByName('LeftArm')!,
      rightArm: this.boneByName('RightArm')!,

      leftHand: this.boneByName('LeftHand')!,
      rightHand: this.boneByName('RightHand')!,
    }

    this.axisBones = {
      forehead: this.createForeheadBone()!,
      neck: this.createNeckBone()!,
      body: this.createBodyCenterBone()!,
    }

    this.ik = new CCDIKSolver(this.mesh, [])
    this.morph()

    window.ikManager = this
  }

  get bones() {
    return this.mesh.skeleton.bones
  }

  get root() {
    return this.bones[0].parent!
  }

  boneByName(key: BoneKey) {
    return this.bones.find((b) => b.name === key)
  }

  boneIdByName(name: BoneKey): number {
    return this.bones.findIndex((b) => name === b.name)
  }

  createForeheadBone() {
    const ref = this.boneByName('Head')
    if (!ref) return

    const fore = new Bone()
    fore.visible = true

    ref.getWorldPosition(fore.position)
    fore.rotation.setFromQuaternion(ref.quaternion)
    fore.position.y += 0.15

    return fore
  }

  // ? we use the existing neck bone for now
  createNeckBone() {
    return this.boneByName('Neck')
  }

  addBone(bone: Bone) {
    // TODO: this crashes skeleton.update()
    // this.mesh.skeleton.bones.push(bone)

    this.mesh.add(bone)
    this.mesh.skeleton.update()
  }

  // ? we use the existing spine bone for now
  createBodyCenterBone() {
    return this.boneByName('Spine1')
  }

  valid(id: number | undefined | null) {
    return typeof id === 'number'
  }

  validate(iks: IK[]) {
    if (!iks) return false

    for (const ik of iks) {
      if (!this.valid(ik.target)) return false
      if (!this.valid(ik.effector)) return false

      for (const link of ik.links) {
        if (!this.valid(link.index)) return false
      }
    }

    console.debug('Valid IK definitions')

    return true
  }

  update() {
    // Update all IK bones
    this.ik.update()
  }

  set(iks: IK[]) {
    this.ik.set(iks)
  }

  clear() {
    this.set([])
  }

  createMorph(axis: BoneKey, control: BoneKey, links: BoneKey[]): IK {
    const axisId = this.boneIdByName(axis)
    const controlId = this.boneIdByName(control)
    const linkIds = links.map((name) => this.boneIdByName(name))

    return {
      target: axisId,
      effector: controlId,
      links: linkIds.map((index) => ({
        index,
      })),
    }
  }

  morph() {
    this.set([
      this.createMorph('Head', 'LeftHand', ['LeftForeArm', 'LeftArm']),
      {
        // minAngle: 300,
        // maxAngle: 360,
        target: this.boneIdByName('Head'),
        effector: this.boneIdByName('RightHand'),
        links: [
          {
            index: this.boneIdByName('RightForeArm'),
            rotationMin: new Vector3(-0.5, -0.5, -0.5),
            rotationMax: new Vector3(10, 10, 10),
          },
          {
            index: this.boneIdByName('RightArm'),
            // rotationMin: new Vector3(-0.5, -0.5, -0.5),
            // rotationMax: new Vector3(1, 1, 1),
          },
        ],
      },
      this.createMorph('Spine1', 'LeftFoot', ['LeftLeg']),
      this.createMorph('Spine1', 'RightFoot', ['RightLeg']),
    ])
  }
}
